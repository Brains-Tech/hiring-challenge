import { Part } from "../models/Part";
import { DatabaseContext } from "../config/database-context";
import { QueryFailedError, Repository } from "typeorm";
import { Maintenance, MaintenanceRecurrenceEnum } from "../models/Maintenance";
import { PartNotFoundError } from "../errors/PartNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { MaintenanceNotFoundError } from "../errors/MaintenanceNotFoundError";
import { addDateInterval } from "../utils/addDateInterval";
import { DependencyExistsError } from "../errors/DependencyExistsError";
import { CreateUpdateMaintenanceDTO } from "../dtos/CreateUpdateMaintenance.dto";

export class MaintenanceService {
    private partRepository: Repository<Part>;
    private maintenanceRepository: Repository<Maintenance>;

    constructor() {
        this.partRepository = DatabaseContext.getInstance().getRepository(Part);
        this.maintenanceRepository = DatabaseContext.getInstance().getRepository(Maintenance);
    }

    public async findAll(): Promise<Maintenance[]> {
        return this.maintenanceRepository.find({
            relations: [
                "part",
                "part.equipment",
                "part.equipment.area",
                "part.equipment.area.plant",
            ],
        });
    }

    public async findById(id: string): Promise<Maintenance> {
        const maintenance = await this.maintenanceRepository.findOne({
            where: { id },
            relations: [
                "part",
                "part.equipment",
                "part.equipment.area",
                "part.equipment.area.plant",
            ],
        });

        if (!maintenance) {
            throw new MaintenanceNotFoundError();
        }

        return maintenance;
    }


    public async create(data: CreateUpdateMaintenanceDTO): Promise<Maintenance> {
        try {
            const part = await this.partRepository.findOne({
                where: { id: data.partId },
                relations: ["equipment"],
            });


            if (this.hasScheduledDateConflict(data.recurrence, data.scheduledDate)) {
                throw new InvalidDataError("Inconsistent scheduledDate and recurrence values");
            }

            if (!part) throw new PartNotFoundError();

            const dueDate = this.calculateDueDate(data.recurrence, data.scheduledDate, part);

            const maintenance = this.maintenanceRepository.create({
                ...data,
                dueDate,
            });

            const saved = await this.maintenanceRepository.save(maintenance);

            return this.findById(saved.id);
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes("FOREIGN KEY")) {
                throw new InvalidForeignKeyError("Invalid part ID");
            }
            throw new InvalidDataError("Invalid maintenance data");
        }
    }


    public async update(id: string, data: CreateUpdateMaintenanceDTO): Promise<Maintenance> {
        try {
            const maintenance = await this.findById(id);

            if (this.hasScheduledDateConflict(data.recurrence, data.scheduledDate)) {
                throw new InvalidDataError("Inconsistent scheduledDate and recurrence values");
            }

            const part = await this.partRepository.findOne({
                where: { id: data.partId },
                relations: ["equipment"],
            });

            if (!part) throw new PartNotFoundError();

            const dueDate = this.calculateDueDate(data?.recurrence, data.scheduledDate, part);

            const updatedMaintenance = this.maintenanceRepository.merge(maintenance, {
                ...data,
                dueDate,
            });

            await this.maintenanceRepository.save(updatedMaintenance);

            return this.findById(updatedMaintenance.id);
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes("FOREIGN KEY")) {
                throw new InvalidForeignKeyError("Invalid part ID");
            }
            throw new InvalidDataError("Invalid maintenance data");
        }
    }

    public async delete(id: string): Promise<void> {
        const maintenance = await this.maintenanceRepository.findOne({ where: { id } });
        if (!maintenance) {
            throw new MaintenanceNotFoundError();
        }
        try {
            await this.maintenanceRepository.remove(maintenance);
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes("FOREIGN KEY")) {
                throw new DependencyExistsError("Cannot delete maintenance with existing dependencies");
            }

            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid maintenance data");
            }


            throw error;
        }
    }




    private calculateDueDate(
        recurrence: MaintenanceRecurrenceEnum,
        scheduledDate: Date | undefined,
        part: Part
    ): Date {
        if (recurrence === MaintenanceRecurrenceEnum.NONE && scheduledDate) {
            return scheduledDate;
        }

        const baseDate = part.installationDate || part.equipment?.initialOperationsDate;

        if (!baseDate) {
            throw new InvalidDataError("No base date to calculate due date");
        }

        const recurrenceMap = new Map<MaintenanceRecurrenceEnum, (date: Date) => Date>([
            [MaintenanceRecurrenceEnum.MONTHLY, (date) => addDateInterval(date, 1, 'months')],
            [MaintenanceRecurrenceEnum.QUARTERLY, (date) => addDateInterval(date, 3, 'months')],
            [MaintenanceRecurrenceEnum.SEMIANNUAL, (date) => addDateInterval(date, 6, 'months')],
            [MaintenanceRecurrenceEnum.ANNUAL, (date) => addDateInterval(date, 1, 'years')],
        ]);

        const handler = recurrenceMap.get(recurrence);

        if (!handler) {
            throw new InvalidDataError("Invalid recurrence type");
        }

        return handler(baseDate);
    }


    private hasScheduledDateConflict(recurrence: MaintenanceRecurrenceEnum, scheduledDate?: Date): boolean {
        return (
            (recurrence === MaintenanceRecurrenceEnum.NONE && !scheduledDate) ||
            (recurrence !== MaintenanceRecurrenceEnum.NONE && !!scheduledDate)
        );
    }











}