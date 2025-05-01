import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { Area } from "./Area";
import { Part } from "./Part";
import { ModelBase } from "./ModelBase";


@Entity()
export class Equipment extends ModelBase {
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
} 