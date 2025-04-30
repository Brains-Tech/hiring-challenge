import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Plant } from "./Plant";
import { Equipment } from "./Equipment";
import { AreaNeighbor } from "./AreaNeighbor";
import { EquipmentArea } from "./EquipmentArea";

@Entity()
export class Area {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column()
    locationDescription!: string;

    @ManyToOne(() => Plant, plant => plant.areas)
    plant?: Plant;

    @Column()
    plantId!: string;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    // Novas relações
    @OneToMany(() => AreaNeighbor, areaNeighbor => areaNeighbor.area)
    neighborRelations!: AreaNeighbor[];

    @OneToMany(() => Equipment, equipment => equipment.area)
    equipment?: Equipment[];

    @OneToMany(() => AreaNeighbor, areaNeighbor => areaNeighbor.neighbor)
    neighboredByRelations!: AreaNeighbor[];

    getNeighborCount(): number {
        const count1 = this.neighborRelations?.length || 0;
        const count2 = this.neighboredByRelations?.length || 0;
        return count1 + count2;
    }

    @OneToMany(() => EquipmentArea, equipmentArea => equipmentArea.area)
    equipmentRelations!: EquipmentArea[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
} 