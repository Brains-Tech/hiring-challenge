import { MaintenanceRecurrenceEnum } from "../models/Maintenance";

export interface CreateUpdateMaintenanceDTO {
    title: string;
    recurrence: MaintenanceRecurrenceEnum;
    scheduledDate?: Date;
    description?: string;
    partId: string;
}