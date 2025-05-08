import { Body, Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from "tsoa";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { MaintenanceService } from "../services/MaintenanceService";
import { MaintenanceNotFoundError } from "../errors/MaintenanceNotFoundError";
import { CreateUpdateMaintenanceDTO } from "../dtos/CreateUpdateMaintenance.dto";
import { IMaintenanceFormatted } from "../interfaces/IMaintenanceFormatted";


@Route("maintenance")
@Tags("Maintenance")
export class MaintenanceController extends Controller {
    private maintenanceService: MaintenanceService;

    constructor() {
        super();
        this.maintenanceService = new MaintenanceService();
    }


    @Security("jwt")
    @Get()
    public async getMaintenances(): Promise<IMaintenanceFormatted[]> {
        return this.maintenanceService.findAll();
    }


    @Security("jwt")
    @Get("{maintenanceId}")
    public async getMaintenanceById(@Path() maintenanceId: string): Promise<IMaintenanceFormatted> {
        try {
            return this.maintenanceService.findById(maintenanceId);
        } catch (error) {
            if (error instanceof MaintenanceNotFoundError) {
                this.setStatus(MaintenanceNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }

    @Security("jwt")
    @Post()
    public async createMaintenance(@Body() requestBody: CreateUpdateMaintenanceDTO): Promise<IMaintenanceFormatted> {

        try {
            return this.maintenanceService.create(requestBody);
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


    @Security("jwt")
    @Put("{maintenanceId}")
    public async updateMaintenance(
        @Path() maintenanceId: string,
        @Body() requestBody: CreateUpdateMaintenanceDTO
    ): Promise<IMaintenanceFormatted> {
        try {
            return this.maintenanceService.update(maintenanceId, requestBody);
        } catch (error) {
            if (error instanceof MaintenanceNotFoundError) {
                this.setStatus(MaintenanceNotFoundError.httpStatusCode);
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



    @Security("jwt")
    @Delete("{maintenanceId}")
    public async deleteMaintenance(@Path() maintenanceId: string): Promise<void> {
        try {
            await this.maintenanceService.delete(maintenanceId);
            this.setStatus(204);
        } catch (error) {
            if (error instanceof MaintenanceNotFoundError) {
                this.setStatus(MaintenanceNotFoundError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }


} 