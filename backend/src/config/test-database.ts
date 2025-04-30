import { DataSource } from "typeorm";
import { Plant } from "../models/Plant";
import { Area } from "../models/Area";
import { Equipment } from "../models/Equipment";
import { Part } from "../models/Part";
import { Task } from "../models/Task";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    logging: true,
    entities: [Plant, Area, Equipment, Part, Task],
    migrations: [],
    subscribers: [],
}); 