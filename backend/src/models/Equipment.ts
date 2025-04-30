import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Area } from "./Area";
import { Part } from "./Part";
import { EquipmentArea } from "./EquipmentArea";

@Entity()
export class Equipment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column()
    manufacturer!: string;

    @Column()
    serialNumber!: string;

    @Column({ type: "date" })
    initialOperationsDate!: Date;

    @ManyToOne(() => Area, area => area.equipment)
    area?: Area;

    @Column()
    areaId!: string;

    @OneToMany(() => Part, part => part.equipment)
    parts?: Part[];

    // Nova relação
    @OneToMany(() => EquipmentArea, equipmentArea => equipmentArea.equipment)
    areaRelations!: EquipmentArea[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
} 