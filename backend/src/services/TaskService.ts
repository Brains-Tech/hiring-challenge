import { Task, TaskStatus, TaskPriority } from "../models/Task";
import { DatabaseContext } from "../config/database-context";
import { Repository, QueryFailedError, Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { InvalidDataError } from "../errors/InvalidDataError";

// Definindo o erro para tarefas não encontradas
export class TaskNotFoundError extends Error {
  static readonly httpStatusCode = 404;
  constructor(message: string = "Task not found") {
    super(message);
    this.name = 'TaskNotFoundError';
    Object.setPrototypeOf(this, TaskNotFoundError.prototype);
  }
}

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

    public async create(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
        try {
            const task = this.taskRepository.create(data);
            return await this.taskRepository.save(task);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid task data");
            }
            throw error;
        }
    }

    public async update(id: string, data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task> {
        const task = await this.findById(id);

        try {
            // Atualiza os campos
            Object.assign(task, data);
            
            // Atualiza a data de modificação
            task.updatedAt = new Date();
            
            return await this.taskRepository.save(task);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid task data");
            }
            throw error;
        }
    }

    public async delete(id: string): Promise<void> {
        const task = await this.findById(id);
        
        try {
            await this.taskRepository.remove(task);
        } catch (error) {
            throw new InvalidDataError("Error deleting task");
        }
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
}