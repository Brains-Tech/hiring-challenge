import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { Plant } from "./Plant";
import { Equipment } from "./Equipment";
import { ModelBase } from "./ModelBase";


@Entity()
export class Area extends ModelBase {
    @Column()
    name!: string;

    @Column()
    locationDescription!: string;

    @ManyToOne(() => Plant, plant => plant.areas)
    plant?: Plant;

    @Column()
    plantId!: string;

    @OneToMany(() => Equipment, equipment => equipment.area)
    equipment?: Equipment[];

} 