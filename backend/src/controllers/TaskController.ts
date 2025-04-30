import { Body, Controller, Get, Path, Post, Put, Delete, Route, Tags, Query } from "tsoa";
import { Task, TaskStatus, TaskPriority } from "../models/Task";
import { InvalidDataError } from "../errors/InvalidDataError";
import { TaskNotFoundError } from "../errors/TaskNotFoundError";
import { TaskService } from "../services/TaskService";

@Route("tasks")
@Tags("Tasks")
export class TaskController extends Controller {
    private taskService: TaskService;

    constructor() {
        super();
        this.taskService = new TaskService();
    }

    @Get()
    public async getTasks(
        @Query() status?: TaskStatus,
        @Query() priority?: TaskPriority,
        @Query() dueFrom?: string,
        @Query() dueTo?: string
    ): Promise<Task[]> {
        const filters: any = {};
        
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        
        // Converte strings de data para objetos Date
        if (dueFrom) filters.dueFrom = new Date(dueFrom);
        if (dueTo) filters.dueTo = new Date(dueTo);
        
        return this.taskService.findAll(filters);
    }

    @Get("{taskId}")
    public async getTaskById(@Path() taskId: string): Promise<Task> {
        try {
            return await this.taskService.findById(taskId);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Post()
    public async createTask(@Body() requestBody: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
        try {
            return await this.taskService.create(requestBody);
        } catch (error) {
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Put("{taskId}")
    public async updateTask(
        @Path() taskId: string,
        @Body() requestBody: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
    ): Promise<Task> {
        try {
            return await this.taskService.update(taskId, requestBody);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Delete("{taskId}")
    public async deleteTask(@Path() taskId: string): Promise<void> {
        try {
            await this.taskService.delete(taskId);
            this.setStatus(204); // No Content
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Post("{taskId}/complete")
    public async completeTask(@Path() taskId: string): Promise<Task> {
        try {
            return await this.taskService.completeTask(taskId);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Post("{taskId}/start")
    public async startTask(@Path() taskId: string): Promise<Task> {
        try {
            return await this.taskService.startTask(taskId);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Post("{taskId}/cancel")
    public async cancelTask(@Path() taskId: string): Promise<Task> {
        try {
            return await this.taskService.cancelTask(taskId);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    /**
     * Obtém todas as ocorrências de uma tarefa recorrente
     */
    @Get("{taskId}/recurrence-dates")
    public async getTaskRecurrenceDates(@Path() taskId: string): Promise<string[]> {
        try {
            return await this.taskService.getRecurrenceDates(taskId);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                this.setStatus(TaskNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }
}