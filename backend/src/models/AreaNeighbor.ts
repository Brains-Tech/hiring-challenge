// src/models/AreaNeighbor.ts
import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Column, Check, Index } from "typeorm";
import { Area } from "./Area";

@Entity()
@Check(`"areaId" <> "neighborId"`)
@Index(["areaId", "neighborId"], { unique: true })
export class AreaNeighbor {
    @PrimaryColumn()
    areaId!: string;

    @PrimaryColumn()
    neighborId!: string;
    
    @Column({ type: "varchar", nullable: true })
    notes?: string;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ nullable: true })
    createdBy?: string;

    @ManyToOne(() => Area, area => area.neighborRelations, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "areaId" })
    area!: Area;

    @ManyToOne(() => Area, area => area.neighboredByRelations, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "neighborId" })
    neighbor!: Area;
}