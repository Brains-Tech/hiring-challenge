import { MaintenanceRecurrenceEnum } from "../models/Maintenance";

export interface IMaintenanceFormatted {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    scheduledDate?: Date;
    recurrence: MaintenanceRecurrenceEnum;
    dueDate: Date;
    description?: string;
    part: {
        id: string;
        name: string;
        installationDate?: Date;
    };
    equipment: {
        id: string;
        name: string;
        initialOperationsDate?: Date;
    };
    area: {
        id: string;
        name: string;
    };
    plant: {
        id: string;
        name: string;
    };
}