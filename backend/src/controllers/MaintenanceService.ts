import { Body, Controller, Get, Path, Post, Route, Security, Tags } from "tsoa";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { MaintenanceService } from "../services/MaintenanceService";
import { Maintenance } from "../models/Maintenance";
import { MaintenanceNotFoundError } from "../errors/MaintenanceNotFoundError";
// import { DependencyExistsError } from "../errors/DependencyExistsError";

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
    public async getMaintenances(): Promise<Maintenance[]> {
        return this.maintenanceService.findAll();
    }


    @Security("jwt")
    @Get("{maintenanceId}")
    public async getMaintenanceById(@Path() maintenanceId: string): Promise<Maintenance> {
        try {
            return await this.maintenanceService.findById(maintenanceId);
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
    public async createEquipment(@Body() requestBody: any): Promise<Maintenance> {
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


} 