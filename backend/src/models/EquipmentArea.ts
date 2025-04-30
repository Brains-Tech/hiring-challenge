// src/models/EquipmentArea.ts
import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Column, Index } from "typeorm";
import { Equipment } from "./Equipment";
import { Area } from "./Area";

@Entity()
@Index(["equipmentId", "areaId"], { unique: true })
export class EquipmentArea {
    @PrimaryColumn()
    equipmentId!: string;

    @PrimaryColumn()
    areaId!: string;

    @Column({ type: "boolean", default: false })
    isPrimary!: boolean;

    @Column({ type: "datetime", nullable: true })
    assignedSince?: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ nullable: true })
    createdBy?: string;

    @Column({ type: "varchar", nullable: true })
    notes?: string;

    @ManyToOne(() => Equipment, equipment => equipment.areaRelations, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "equipmentId" })
    equipment!: Equipment;

    @ManyToOne(() => Area, area => area.equipmentRelations, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "areaId" })
    area!: Area;
}