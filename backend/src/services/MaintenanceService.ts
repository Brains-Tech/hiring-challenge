import { Part } from "../models/Part";
import { DatabaseContext } from "../config/database-context";
import { MoreThanOrEqual, QueryFailedError, Repository } from "typeorm";
import { Maintenance, MaintenanceRecurrenceEnum } from "../models/Maintenance";
import { PartNotFoundError } from "../errors/PartNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { MaintenanceNotFoundError } from "../errors/MaintenanceNotFoundError";
import { addDateInterval } from "../utils/addDateInterval";
import { DependencyExistsError } from "../errors/DependencyExistsError";
import { CreateUpdateMaintenanceDTO } from "../dtos/CreateUpdateMaintenance.dto";
import { IMaintenanceFormatted } from "../interfaces/IMaintenanceFormatted";
import dayjs from "dayjs";

export class MaintenanceService {
    private partRepository: Repository<Part>;
    private maintenanceRepository: Repository<Maintenance>;

    constructor() {
        this.partRepository = DatabaseContext.getInstance().getRepository(Part);
        this.maintenanceRepository = DatabaseContext.getInstance().getRepository(Maintenance);
    }

    public async findAll(): Promise<IMaintenanceFormatted[]> {
        const today = dayjs().startOf("day").toDate();

        const maintenances = await this.maintenanceRepository.find({
            where: {
                dueDate: MoreThanOrEqual(today),
            },
            order: {
                dueDate: "ASC",
            },
            relations: [
                "part",
                "part.equipment",
                "part.equipment.area",
                "part.equipment.area.plant",
            ],
        });


        return maintenances.map((maintenance) => this.formatMaintenanceData(maintenance));
    }

    public async findById(id: string): Promise<IMaintenanceFormatted> {
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

        return this.formatMaintenanceData(maintenance);
    }


    public async create(data: CreateUpdateMaintenanceDTO): Promise<IMaintenanceFormatted> {
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

            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid maintenance data");
            }

            if (error instanceof InvalidDataError) {
                throw error;
            }


            throw new InvalidDataError("Invalid maintenance data");
        }
    }


    public async update(id: string, data: CreateUpdateMaintenanceDTO): Promise<IMaintenanceFormatted> {
        try {
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

            if (this.hasScheduledDateConflict(data.recurrence, data.scheduledDate)) {
                throw new InvalidDataError("Inconsistent scheduledDate and recurrence values");
            }

            const part = await this.partRepository.findOne({
                where: { id: data.partId },
                relations: ["equipment"],
            });

            if (!part) throw new PartNotFoundError();

            const dueDate = this.calculateDueDate(data.recurrence, data.scheduledDate, part);

            const updatedMaintenance = this.maintenanceRepository.merge(maintenance, {
                ...data,
                scheduledDate: data.scheduledDate ?? '',
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
        const baseDate = part.installationDate || part.equipment?.initialOperationsDate;

        if (!baseDate) {
            throw new InvalidDataError("No base date to calculate due date");
        }

        if (recurrence === MaintenanceRecurrenceEnum.NONE) {
            if (!scheduledDate) {
                throw new InvalidDataError("Scheduled date must be provided for 'NONE' recurrence");
            }

            if (scheduledDate < baseDate) {
                throw new InvalidDataError("Scheduled date cannot be before installation date");
            }

            return scheduledDate;
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

    private formatMaintenanceData(maintenance: Maintenance): IMaintenanceFormatted {
        return {
            id: maintenance.id,
            createdAt: maintenance.createdAt,
            updatedAt: maintenance.updatedAt,
            title: maintenance.title,
            scheduledDate: maintenance.scheduledDate,
            recurrence: maintenance.recurrence,
            dueDate: maintenance.dueDate,
            description: maintenance.description,
            part: {
                id: maintenance.part.id,
                name: maintenance.part.name,
                installationDate: maintenance.part.installationDate,
            },
            equipment: {
                id: maintenance?.part?.equipment?.id || '',
                name: maintenance?.part?.equipment?.name || '',
                initialOperationsDate: maintenance?.part?.equipment?.initialOperationsDate || new Date(),
            },
            area: {
                id: maintenance?.part?.equipment?.area?.id || '',
                name: maintenance?.part?.equipment?.area?.name || '',
            },
            plant: {
                id: maintenance?.part?.equipment?.area?.plant?.id || '',
                name: maintenance?.part?.equipment?.area?.plant?.name || '',
            }
        };
    }
}