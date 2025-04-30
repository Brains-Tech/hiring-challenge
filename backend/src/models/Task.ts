import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}

export enum TaskStatus {
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELED = "canceled"
}

export enum RecurrenceType {
    NONE = "none",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    title!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({
        type: "varchar",
        default: TaskPriority.MEDIUM
    })
    priority!: TaskPriority;

    @Column({
        type: "varchar",
        default: TaskStatus.TODO
    })
    status!: TaskStatus;

    @Column({ type: "date", nullable: true })
    dueDate?: Date;

    // Campos para recorrência
    @Column({
        type: "varchar",
        default: RecurrenceType.NONE
    })
    recurrenceType!: RecurrenceType;

    @Column({ nullable: true })
    recurrenceInterval?: number;

    @Column({ nullable: true })
    recurrenceEndDate?: Date;

    @Column({ nullable: true })
    parentTaskId?: string;

    @Column("simple-array", { nullable: true })
    recurrenceDates?: string[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}