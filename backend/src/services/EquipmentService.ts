import { Equipment } from "../models/Equipment";
import { DatabaseContext } from "../config/database-context";
import { Repository, QueryFailedError } from "typeorm";
import { EquipmentNotFoundError } from "../errors/EquipmentNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { DependencyExistsError } from "../errors/DependencyExistsError";
import { EquipmentAreaService } from "./EquipmentAreaService";
import { Area } from "src/models/Area";

export class EquipmentService {
    private equipmentRepository: Repository<Equipment>;
    private equipmentAreaService: EquipmentAreaService;


    constructor() {
        this.equipmentRepository = DatabaseContext.getInstance().getRepository(Equipment);
        this.equipmentAreaService = new EquipmentAreaService();
    }

    public async findAll(): Promise<Equipment[]> {
        return this.equipmentRepository.find({
            relations: ["area", "parts", "areaRelations", "areaRelations.area"]
        });
    }

    public async findById(id: string): Promise<Equipment> {
        const equipment = await this.equipmentRepository.findOne({
            where: { id },
            relations: ["area", "parts"]
        });
        if (!equipment) {
            throw new EquipmentNotFoundError();
        }
        return equipment;
    }

    public async create(data: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<Equipment> {
        try {
            const equipment = this.equipmentRepository.create(data);
            const savedEquipment = await this.equipmentRepository.save(equipment);
            return this.equipmentRepository.findOne({
                where: { id: savedEquipment.id },
                relations: ["area"]
            }) as Promise<Equipment>;
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes('FOREIGN KEY')) {
                throw new InvalidForeignKeyError("Invalid area ID");
            }
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid equipment data");
            }
            throw error;
        }
    }

    public async update(id: string, data: Partial<Omit<Equipment, "id" | "createdAt" | "updatedAt">>): Promise<Equipment> {
        try {
            const equipment = await this.equipmentRepository.findOne({ 
                where: { id },
                relations: ["area"]
            });
            if (!equipment) {
                throw new EquipmentNotFoundError();
            }

            Object.assign(equipment, data);
            await this.equipmentRepository.save(equipment);
            return this.equipmentRepository.findOne({
                where: { id: equipment.id },
                relations: ["area"]
            }) as Promise<Equipment>;
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes('FOREIGN KEY')) {
                throw new InvalidForeignKeyError("Invalid area ID");
            }
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid equipment data");
            }
            throw error;
        }
    }

    public async delete(id: string): Promise<void> {
        const equipment = await this.equipmentRepository.findOne({ 
            where: { id },
            relations: ["parts"]
        });
        if (!equipment) {
            throw new EquipmentNotFoundError();
        }

        try {
            await this.equipmentRepository.remove(equipment);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new DependencyExistsError("Cannot delete equipment with associated parts");
            }
            throw error;
        }
    }

     /**
     * Associa um equipamento a múltiplas áreas
     */
     public async assignToAreas(
        equipmentId: string, 
        areaIds: string[], 
        primaryAreaId?: string
    ): Promise<Equipment> {
        // Delega para o serviço especializado
        await this.equipmentAreaService.assignEquipmentToAreas(
            equipmentId, 
            areaIds, 
            primaryAreaId
        );
        
        // Retorna o equipamento atualizado
        return this.findById(equipmentId);
    }

    /**
     * Obtém todas as áreas associadas a um equipamento
     */
    public async getEquipmentAreas(equipmentId: string): Promise<Area[]> {
        return this.equipmentAreaService.getEquipmentAreas(equipmentId);
    }

    /**
     * Encontra todos os equipamentos em uma área específica
     */
    public async findByArea(areaId: string): Promise<Equipment[]> {
        return this.equipmentAreaService.getAreaEquipments(areaId);
    }
}