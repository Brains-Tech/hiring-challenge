import { Maintenance } from "../models/Maintenance";
import { Area } from "../models/Area";
import { Equipment } from "../models/Equipment";
import { Part } from "../models/Part";
import { Plant } from "../models/Plant";
import { User } from "../models/User";
import { DataSource } from "typeorm";


export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "opwell.sqlite",
    synchronize: true, // Set to false in production
    logging: true,
    entities: [Plant, Area, Equipment, Part, User, Maintenance],
    migrations: [],
    subscribers: [],
}); 