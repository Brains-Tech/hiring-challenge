import { Area } from "../models/Area";
import { DatabaseContext } from "../config/database-context";
import { Repository, QueryFailedError } from "typeorm";
import { AreaNotFoundError } from "../errors/AreaNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { DependencyExistsError } from "../errors/DependencyExistsError";

export class AreaService {
    private areaRepository: Repository<Area>;

    constructor() {
        this.areaRepository = DatabaseContext.getInstance().getRepository(Area);
    }

    public async findAll(): Promise<Area[]> {
        return this.areaRepository.find({
            relations: [
                "plant", 
                "equipment", 
                "equipment.parts",
                "neighborRelations",
                "neighborRelations.neighbor",
                "neighboredByRelations",
                "neighboredByRelations.area"
            ]
        });
    }

    public async findById(id: string): Promise<Area> {
        const area = await this.areaRepository.findOne({
            where: { id },
            relations: ["plant", "equipment", "equipment.parts"]
        });
        if (!area) {
            throw new AreaNotFoundError();
        }
        return area;
    }

    public async create(data: Pick<Area, "name" | "locationDescription" | "plantId">): Promise<Area> {
        try {
            const area = this.areaRepository.create(data);
            const savedArea = await this.areaRepository.save(area);
            return this.areaRepository.findOne({
                where: { id: savedArea.id },
                relations: ["plant"]
            }) as Promise<Area>;
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes('FOREIGN KEY')) {
                throw new InvalidForeignKeyError("Invalid plant ID");
            }
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid area data");
            }
            throw error;
        }
    }

    public async update(id: string, data: Partial<Pick<Area, "name" | "locationDescription">>): Promise<Area> {
        try {
            const area = await this.areaRepository.findOne({ 
                where: { id },
                relations: ["plant"]
            });
            if (!area) {
                throw new AreaNotFoundError();
            }

            Object.assign(area, data);
            await this.areaRepository.save(area);
            return this.areaRepository.findOne({
                where: { id: area.id },
                relations: ["plant"]
            }) as Promise<Area>;
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid area data");
            }
            throw error;
        }
    }

    public async delete(id: string): Promise<void> {
        const area = await this.areaRepository.findOne({ 
            where: { id },
            relations: ["equipment"]
        });
        if (!area) {
            throw new AreaNotFoundError();
        }

        try {
            await this.areaRepository.remove(area);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new DependencyExistsError("Cannot delete area with associated equipment");
            }
            throw error;
        }
    }
} 