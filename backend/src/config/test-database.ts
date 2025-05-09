import { DataSource } from "typeorm";
import { Plant } from "../models/Plant";
import { Area } from "../models/Area";
import { Equipment } from "../models/Equipment";
import { Part } from "../models/Part";
import { Maintenance } from "../models/Maintenance";
import { User } from "../models/User";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    logging: false,
    entities: [Plant, Area, Equipment, Part, Maintenance, User],
    migrations: ["src/migrations/*.ts"],
    subscribers: [],
}); 