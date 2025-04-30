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

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}