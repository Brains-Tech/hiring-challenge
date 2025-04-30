import { DataSource } from "typeorm";
import { Plant } from "../models/Plant";
import { Area } from "../models/Area";
import { Equipment } from "../models/Equipment";
import { Part } from "../models/Part";
import { AreaNeighbor } from "../models/AreaNeighbor";
import { EquipmentArea } from "../models/EquipmentArea";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "opwell.sqlite",
    synchronize: true, // Set to false in production
    logging: true,
    entities: [Plant, Area, Equipment, Part, AreaNeighbor, EquipmentArea],
    migrations: [],
    subscribers: [],
}); 