import { Entity, Column, ManyToOne } from "typeorm";
import { Equipment } from "./Equipment";

import { ModelBase } from "./ModelBase";

export enum PartType {
    ELECTRIC = "electric",
    ELECTRONIC = "electronic",
    MECHANICAL = "mechanical",
    HYDRAULICAL = "hydraulical"
}

@Entity()
export class Part extends ModelBase {
    @Column()
    name!: string;

    @Column({
        type: "varchar",
        default: PartType.MECHANICAL
    })
    type!: PartType;

    @Column()
    manufacturer!: string;

    @Column()
    serialNumber!: string;

    @Column({ type: "date" })
    installationDate!: Date;

    @ManyToOne(() => Equipment, equipment => equipment.parts)
    equipment?: Equipment;

    @Column()
    equipmentId!: string;
    
} 