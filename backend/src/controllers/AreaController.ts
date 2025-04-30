import { Body, Controller, Get, Path, Post, Put, Delete, Route, Tags } from "tsoa";
import { Area } from "../models/Area";
import { AreaService } from "../services/AreaService";
import { AreaNotFoundError } from "../errors/AreaNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { DependencyExistsError } from "../errors/DependencyExistsError";
import { AreaNeighborService } from "../services/AreaNeighborService";
import { EquipmentAreaService } from "../services/EquipmentAreaService";

@Route("areas")
@Tags("Area")
export class AreaController extends Controller {
    private areaService: AreaService;
    private areaNeighborService: AreaNeighborService;
    private equipmentAreaService: EquipmentAreaService;



    constructor() {
        super();
        this.areaService = new AreaService();
        this.areaNeighborService = new AreaNeighborService();
        this.equipmentAreaService = new EquipmentAreaService();

    }

    @Get()
    public async getAreas(): Promise<Area[]> {
        return this.areaService.findAll();
    }

    @Get("{areaId}")
    public async getArea(@Path() areaId: string): Promise<Area> {
        try {
            return await this.areaService.findById(areaId);
        } catch (error) {
            if (error instanceof AreaNotFoundError) {
                this.setStatus(AreaNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Post()
    public async createArea(@Body() requestBody: Pick<Area, "name" | "locationDescription" | "plantId">): Promise<Area> {
        try {
            return await this.areaService.create(requestBody);
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

    /**
     * Obtém todas as áreas vizinhas de uma área específica
     */
    @Get("{areaId}/neighbors")
    public async getAreaNeighbors(@Path() areaId: string): Promise<Area[]> {
        try {
            return await this.areaNeighborService.findNeighbors(areaId);
        } catch (error) {
            if (error instanceof AreaNotFoundError) {
                this.setStatus(AreaNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    /**
     * Adiciona uma relação de vizinhança entre duas áreas
     */
    @Post("{areaId}/neighbors")
    public async addNeighbor(
        @Path() areaId: string,
        @Body() requestBody: { neighborId: string; connectionType?: string; notes?: string; }
    ): Promise<void> {
        try {
            await this.areaNeighborService.createNeighborRelation(
                areaId, 
                requestBody.neighborId, 
                {
                    connectionType: requestBody.connectionType,
                    notes: requestBody.notes
                }
            );
            this.setStatus(201); // Created
        } catch (error) {
            if (error instanceof AreaNotFoundError) {
                this.setStatus(AreaNotFoundError.httpStatusCode);
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
     * Remove uma relação de vizinhança entre duas áreas
     */
    @Delete("{areaId}/neighbors/{neighborId}")
    public async removeNeighbor(
        @Path() areaId: string, 
        @Path() neighborId: string
    ): Promise<void> {
        try {
            // Verificar se há equipamentos que seriam afetados
            const impactedEquipments = await this.equipmentAreaService.getEquipmentImpactedByNeighborRemoval(
                areaId,
                neighborId
            );

            if (impactedEquipments.length > 0) {
                this.setStatus(400);
                throw new DependencyExistsError(
                    `Não é possível remover a relação de vizinhança porque existem ${impactedEquipments.length} equipamentos compartilhados entre estas áreas`
                );
            }

            await this.areaNeighborService.removeNeighborRelation(areaId, neighborId);
            this.setStatus(204); // No Content
        } catch (error) {
            if (error instanceof DependencyExistsError) {
                this.setStatus(DependencyExistsError.httpStatusCode);
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
     * Verifica se duas áreas são vizinhas
     */
     @Get("{areaId}/neighbors/{neighborId}")
     public async checkNeighborRelation(
         @Path() areaId: string, 
         @Path() neighborId: string
     ): Promise<{ areNeighbors: boolean }> {
         const result = await this.areaNeighborService.areNeighbors(areaId, neighborId);
         return { areNeighbors: result };
     }

    @Put("{areaId}")
    public async updateArea(
        @Path() areaId: string,
        @Body() requestBody: Partial<Pick<Area, "name" | "locationDescription">>
    ): Promise<Area> {
        try {
            return await this.areaService.update(areaId, requestBody);
        } catch (error) {
            if (error instanceof AreaNotFoundError) {
                this.setStatus(AreaNotFoundError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Delete("{areaId}")
    public async deleteArea(@Path() areaId: string): Promise<void> {
        try {
            await this.areaService.delete(areaId);
            this.setStatus(204);
        } catch (error) {
            if (error instanceof AreaNotFoundError) {
                this.setStatus(AreaNotFoundError.httpStatusCode);
                throw error;
            }
            if (error instanceof DependencyExistsError) {
                this.setStatus(DependencyExistsError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }
} 