import { Body, Controller, Get, Path, Post, Put, Delete, Route, Tags } from "tsoa";
import { Equipment } from "../models/Equipment";
import { EquipmentService } from "../services/EquipmentService";
import { EquipmentNotFoundError } from "../errors/EquipmentNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { DependencyExistsError } from "../errors/DependencyExistsError";
import { EquipmentAreaService } from "../services/EquipmentAreaService";
import { Area } from "../models/Area";

@Route("equipment")
@Tags("Equipment")
export class EquipmentController extends Controller {
    private equipmentService: EquipmentService;
    private equipmentAreaService: EquipmentAreaService;


    constructor() {
        super();
        this.equipmentService = new EquipmentService();
        this.equipmentAreaService = new EquipmentAreaService();
        
    }

    @Get()
    public async getEquipment(): Promise<Equipment[]> {
        return this.equipmentService.findAll();
    }

    @Get("{equipmentId}")
    public async getEquipmentById(@Path() equipmentId: string): Promise<Equipment> {
        try {
            return await this.equipmentService.findById(equipmentId);
        } catch (error) {
            if (error instanceof EquipmentNotFoundError) {
                this.setStatus(EquipmentNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Post()
    public async createEquipment(@Body() requestBody: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<Equipment> {
        try {
            return await this.equipmentService.create(requestBody);
        } catch (error) {
            if (error instanceof InvalidForeignKeyError) {
                this.setStatus(InvalidForeignKeyError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Put("{equipmentId}")
    public async updateEquipment(
        @Path() equipmentId: string,
        @Body() requestBody: Partial<Omit<Equipment, "id" | "createdAt" | "updatedAt">>
    ): Promise<Equipment> {
        try {
            return await this.equipmentService.update(equipmentId, requestBody);
        } catch (error) {
            if (error instanceof EquipmentNotFoundError) {
                this.setStatus(EquipmentNotFoundError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidForeignKeyError) {
                this.setStatus(InvalidForeignKeyError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Delete("{equipmentId}")
    public async deleteEquipment(@Path() equipmentId: string): Promise<void> {
        try {
            await this.equipmentService.delete(equipmentId);
            this.setStatus(204);
        } catch (error) {
            if (error instanceof EquipmentNotFoundError) {
                this.setStatus(EquipmentNotFoundError.httpStatusCode);
                throw error;
            }
            if (error instanceof DependencyExistsError) {
                this.setStatus(DependencyExistsError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    /**
     * Obtém todas as áreas de um equipamento
     */
    @Get("{equipmentId}/areas")
    public async getEquipmentAreas(@Path() equipmentId: string): Promise<Area[]> {
        try {
            return await this.equipmentAreaService.getEquipmentAreas(equipmentId);
        } catch (error) {
            if (error instanceof EquipmentNotFoundError) {
                this.setStatus(EquipmentNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    /**
     * Associa um equipamento a múltiplas áreas
     */
    @Post("{equipmentId}/areas")
    public async assignToAreas(
        @Path() equipmentId: string,
        @Body() requestBody: { areaIds: string[]; primaryAreaId?: string; }
    ): Promise<Equipment> {
        try {
            return await this.equipmentService.assignToAreas(
                equipmentId,
                requestBody.areaIds,
                requestBody.primaryAreaId
            );
        } catch (error) {
            if (error instanceof EquipmentNotFoundError) {
                this.setStatus(EquipmentNotFoundError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidForeignKeyError) {
                this.setStatus(InvalidForeignKeyError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

     /**
     * Verifica se um equipamento está em uma área específica
     */
     @Get("{equipmentId}/areas/{areaId}")
     public async checkAreaRelationship(
         @Path() equipmentId: string,
         @Path() areaId: string
     ): Promise<{ inArea: boolean }> {
         try {
             const result = await this.equipmentAreaService.isEquipmentInArea(equipmentId, areaId);
             return { inArea: result };
         } catch (error) {
             if (error instanceof EquipmentNotFoundError) {
                 this.setStatus(EquipmentNotFoundError.httpStatusCode);
                 throw error;
             }
             throw error;
         }
     }

     /**
     * Obtém a área primária de um equipamento
     */
    @Get("{equipmentId}/primaryArea")
    public async getPrimaryArea(@Path() equipmentId: string): Promise<Area | null> {
        try {
            return await this.equipmentAreaService.getPrimaryArea(equipmentId);
        } catch (error) {
            if (error instanceof EquipmentNotFoundError) {
                this.setStatus(EquipmentNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }
} 