import { Entity, Column, ManyToOne } from "typeorm";
import { ModelBase } from "./ModelBase";
import { Part } from "./Part";

export enum MaintenanceRecurrenceEnum {
    NONE = "none",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    SEMIANNUAL = "semiannual",
    ANNUAL = "annual",
}

@Entity()
export class Maintenance extends ModelBase {
    @Column()
    title!: string;

    @Column({ type: "date", nullable: true })
    scheduledDate?: Date;

    @Column({
        type: "varchar",
        default: MaintenanceRecurrenceEnum.NONE,
    })
    recurrence!: MaintenanceRecurrenceEnum;

    @Column({ type: "date" })
    dueDate!: Date;

    @Column({ type: "text", nullable: true })
    description?: string;

    @ManyToOne(() => Part)
    part!: Part;

    @Column()
    partId!: string;
}