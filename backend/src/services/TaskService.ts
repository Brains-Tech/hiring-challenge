import { Task, TaskStatus, TaskPriority, RecurrenceType } from "../models/Task";
import { DatabaseContext } from "../config/database-context";
import { Repository, QueryFailedError, Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { InvalidDataError } from "../errors/InvalidDataError";
import dayjs from "dayjs";
import { TaskNotFoundError } from "../errors/TaskNotFoundError";

export class TaskService {
    private taskRepository: Repository<Task>;

    constructor() {
        this.taskRepository = DatabaseContext.getInstance().getRepository(Task);
    }

    public async findAll(filters?: {
        status?: TaskStatus;
        priority?: TaskPriority;
        dueFrom?: Date;
        dueTo?: Date;
    }): Promise<Task[]> {
        const whereClause: any = {};
        
        if (filters) {
            if (filters.status) {
                whereClause.status = filters.status;
            }
            
            if (filters.priority) {
                whereClause.priority = filters.priority;
            }
            
            // Filtro por intervalo de datas
            if (filters.dueFrom && filters.dueTo) {
                whereClause.dueDate = Between(filters.dueFrom, filters.dueTo);
            } else if (filters.dueFrom) {
                whereClause.dueDate = MoreThanOrEqual(filters.dueFrom);
            } else if (filters.dueTo) {
                whereClause.dueDate = LessThanOrEqual(filters.dueTo);
            }
        }
        
        return this.taskRepository.find({
            where: whereClause,
            order: {
                dueDate: 'ASC',
                createdAt: 'DESC'
            }
        });
    }

    public async findById(id: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id }
        });
        
        if (!task) {
            throw new TaskNotFoundError();
        }
        
        return task;
    }

    /**
     * Gera as datas de ocorrência com base nos parâmetros de recorrência
     */
    private generateOccurrenceDates(
        startDate: Date,
        recurrenceType: RecurrenceType,
        recurrenceInterval: number = 1,
        recurrenceEndDate?: Date,
        maxOccurrences: number = 50 // Limitamos a 50 ocorrências por padrão
    ): string[] {
        // Se não for recorrente, só retorna a data inicial
        if (recurrenceType === RecurrenceType.NONE) {
            return [dayjs(startDate).format('YYYY-MM-DD')];
        }
        
        const dates: string[] = [];
        let currentDate = dayjs(startDate);
        
        // Adicionar a primeira data (original)
        dates.push(currentDate.format('YYYY-MM-DD'));
        
        while (dates.length < maxOccurrences) {
            switch (recurrenceType) {
                case RecurrenceType.DAILY:
                    currentDate = currentDate.add(recurrenceInterval, 'day');
                    break;
                case RecurrenceType.WEEKLY:
                    currentDate = currentDate.add(recurrenceInterval, 'week');
                    break;
                case RecurrenceType.MONTHLY:
                    currentDate = currentDate.add(recurrenceInterval, 'month');
                    break;
                case RecurrenceType.YEARLY:
                    currentDate = currentDate.add(recurrenceInterval, 'year');
                    break;
            }
            
            // Verificar se ultrapassou a data final de recorrência
            if (recurrenceEndDate && currentDate.isAfter(dayjs(recurrenceEndDate))) {
                break;
            }
            
            // Adicionar a data ao array
            dates.push(currentDate.format('YYYY-MM-DD'));
        }
        
        return dates;
    }

    public async create(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
        try {
            if (data.recurrenceType !== RecurrenceType.NONE && data.dueDate) {
                const recurrenceDates = this.generateOccurrenceDates(
                    data.dueDate,
                    data.recurrenceType,
                    data.recurrenceInterval,
                    data.recurrenceEndDate
                );
                
                data.recurrenceDates = recurrenceDates;
                
                const task = this.taskRepository.create(data);
                const savedTask = await this.taskRepository.save(task);
                
                if (data.recurrenceInterval && data.recurrenceInterval > 0) {
                    await this.createRecurringTaskOccurrences(savedTask);
                }
                
                return savedTask;
            } else {
                if (data.dueDate) {
                    data.recurrenceDates = [dayjs(data.dueDate).format('YYYY-MM-DD')];
                }
                
                const task = this.taskRepository.create(data);
                return await this.taskRepository.save(task);
            }
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Dados de tarefa inválidos");
            }
            throw error;
        }
    }

    private async createRecurringTaskOccurrences(parentTask: Task, numberOfOccurrences = 5): Promise<void> {
        if (parentTask.recurrenceType === RecurrenceType.NONE || !parentTask.dueDate) {
            return;
        }

        const occurrences = [];
        let currentDate = dayjs(parentTask.dueDate);

        // Criar ocorrências futuras com base no tipo de recorrência
        for (let i = 0; i < numberOfOccurrences; i++) {
            // Calcular a próxima data com base no tipo de recorrência
            switch (parentTask.recurrenceType) {
                case RecurrenceType.DAILY:
                    currentDate = currentDate.add((parentTask.recurrenceInterval || 1), 'day');
                    break;
                case RecurrenceType.WEEKLY:
                    currentDate = currentDate.add((parentTask.recurrenceInterval || 1), 'week');
                    break;
                case RecurrenceType.MONTHLY:
                    currentDate = currentDate.add((parentTask.recurrenceInterval || 1), 'month');
                    break;
                case RecurrenceType.YEARLY:
                    currentDate = currentDate.add((parentTask.recurrenceInterval || 1), 'year');
                    break;
            }
            
            if (parentTask.recurrenceEndDate && currentDate.isAfter(dayjs(parentTask.recurrenceEndDate))) {
                break;
            }
            
            const newTask = this.taskRepository.create({
                title: parentTask.title,
                description: parentTask.description,
                priority: parentTask.priority,
                status: TaskStatus.TODO,
                dueDate: currentDate.toDate(),
                parentTaskId: parentTask.id,
                recurrenceType: RecurrenceType.NONE
            });
            
            occurrences.push(newTask);
        }
        
        // Salvar todas as ocorrências
        if (occurrences.length > 0) {
            await this.taskRepository.save(occurrences);
        }
    }

    public async update(id: string, data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task> {
        const task = await this.findById(id);

        try {
            if (
                (data.recurrenceType && data.recurrenceType !== task.recurrenceType) ||
                (data.recurrenceInterval && data.recurrenceInterval !== task.recurrenceInterval) ||
                (data.recurrenceEndDate && !task.recurrenceEndDate) ||
                (task.recurrenceEndDate && data.recurrenceEndDate && 
                 dayjs(data.recurrenceEndDate).format('YYYY-MM-DD') !== dayjs(task.recurrenceEndDate).format('YYYY-MM-DD')) ||
                (data.dueDate && task.dueDate && 
                 dayjs(data.dueDate).format('YYYY-MM-DD') !== dayjs(task.dueDate).format('YYYY-MM-DD'))
            ) {
                if (data.recurrenceType === RecurrenceType.NONE) {
                    if (data.dueDate) {
                        data.recurrenceDates = [dayjs(data.dueDate).format('YYYY-MM-DD')];
                    } else if (task.dueDate) {
                        data.recurrenceDates = [dayjs(task.dueDate).format('YYYY-MM-DD')];
                    } else {
                        data.recurrenceDates = undefined;
                    }
                } else {
                    const startDate = data.dueDate || task.dueDate;
                    if (startDate) {
                        const recType = data.recurrenceType || task.recurrenceType;
                        const recInterval = data.recurrenceInterval || task.recurrenceInterval || 1;
                        const recEndDate = data.recurrenceEndDate || task.recurrenceEndDate;
                        
                        data.recurrenceDates = this.generateOccurrenceDates(
                            startDate,
                            recType,
                            recInterval,
                            recEndDate
                        );
                    }
                }
            }
            
            if (
                task.recurrenceType !== RecurrenceType.NONE && 
                data.recurrenceType !== undefined
            ) {
                if (data.title || data.description || data.priority) {
                    await this.updateFutureOccurrences(task, data);
                }
            }
            
            Object.assign(task, data);
            task.updatedAt = new Date();
            
            return await this.taskRepository.save(task);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Dados de tarefa inválidos");
            }
            throw error;
        }
    }

    private async updateFutureOccurrences(
        parentTask: Task, 
        data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
    ): Promise<void> {
        // Buscar todas as ocorrências futuras (tarefas com parentTaskId igual ao id da tarefa atual)
        const futureOccurrences = await this.taskRepository.find({
            where: { 
                parentTaskId: parentTask.id,
                status: TaskStatus.TODO // Só atualiza tarefas pendentes
            }
        });
        
        if (futureOccurrences.length === 0) {
            return;
        }
        
        // Atualizar cada ocorrência futura
        for (const occurrence of futureOccurrences) {
            if (data.title) occurrence.title = data.title;
            if (data.description) occurrence.description = data.description;
            if (data.priority) occurrence.priority = data.priority;
            
            occurrence.updatedAt = new Date();
        }
        
        // Salvar todas as atualizações
        await this.taskRepository.save(futureOccurrences);
    }

    public async delete(id: string): Promise<void> {
        const task = await this.findById(id);
        
        try {
            if (task.recurrenceType !== RecurrenceType.NONE) {
                await this.deleteFutureOccurrences(task);
            }
            
            await this.taskRepository.remove(task);
        } catch (error) {
            throw new InvalidDataError("Erro ao excluir tarefa");
        }
    }

    private async deleteFutureOccurrences(task: Task): Promise<void> {
        const futureOccurrences = await this.taskRepository.find({
            where: { parentTaskId: task.id }
        });
        
        if (futureOccurrences.length === 0) {
            return;
        }
        
        // Excluir todas as ocorrências
        await this.taskRepository.remove(futureOccurrences);
    }
    
    // Métodos para alterações comuns de status
    public async completeTask(id: string): Promise<Task> {
        return this.update(id, { status: TaskStatus.COMPLETED });
    }

    public async startTask(id: string): Promise<Task> {
        return this.update(id, { status: TaskStatus.IN_PROGRESS });
    }

    public async cancelTask(id: string): Promise<Task> {
        return this.update(id, { status: TaskStatus.CANCELED });
    }
    
    // Método para obter as datas de ocorrência
    public async getRecurrenceDates(id: string): Promise<string[]> {
        const task = await this.findById(id);
        return task.recurrenceDates || [];
    }
}