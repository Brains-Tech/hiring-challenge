import { DataSource } from "typeorm";
import { Plant } from "../models/Plant";
import { Area } from "../models/Area";
import { Equipment } from "../models/Equipment";
import { Part } from "../models/Part";
import { Maintenance } from "../models/Maintenance";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    logging: true,
    entities: [Plant, Area, Equipment, Part, Maintenance],
    migrations: ["src/migrations/*.ts"],
    subscribers: [],
}); 