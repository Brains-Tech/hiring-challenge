import { Entity, Column, OneToMany } from "typeorm";
import { Area } from "./Area";
import { ModelBase } from "./ModelBase";

@Entity()
export class Plant extends ModelBase {
    @Column()
    name!: string;

    @Column()
    address!: string;

    @OneToMany(() => Area, area => area.plant)
    areas?: Area[];
} 