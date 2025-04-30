// ../services/EquipmentAreaService.ts
import { EquipmentArea } from "../models/EquipmentArea";
import { Equipment } from "../models/Equipment";
import { Area } from "../models/Area";
import { DatabaseContext } from "../config/database-context";
import { Repository, QueryFailedError, In } from "typeorm";
import { EquipmentNotFoundError } from "../errors/EquipmentNotFoundError";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { AreaNeighborService } from "./AreaNeighborService";

export class EquipmentAreaService {
    private equipmentAreaRepository: Repository<EquipmentArea>;
    private equipmentRepository: Repository<Equipment>;
    private areaRepository: Repository<Area>;
    private areaNeighborService: AreaNeighborService;

    constructor() {
        this.equipmentAreaRepository = DatabaseContext.getInstance().getRepository(EquipmentArea);
        this.equipmentRepository = DatabaseContext.getInstance().getRepository(Equipment);
        this.areaRepository = DatabaseContext.getInstance().getRepository(Area);
        this.areaNeighborService = new AreaNeighborService();
    }

    /**
     * Associa um equipamento a múltiplas áreas
     */
    public async assignEquipmentToAreas(
        equipmentId: string, 
        areaIds: string[], 
        primaryAreaId?: string
    ): Promise<void> {
        await this.validateEquipmentExists(equipmentId);
        await this.validateAreasExist(areaIds);
        await this.validateAreasAreConnected(areaIds);
        this.validatePrimaryArea(areaIds, primaryAreaId);

        try {
            await this.updateEquipmentAreas(equipmentId, areaIds, primaryAreaId);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Erro ao associar equipamento às áreas");
            }
            throw error;
        }
    }

    /**
     * Obtém todas as áreas associadas a um equipamento
     */
    public async getEquipmentAreas(equipmentId: string): Promise<Area[]> {
        const equipmentAreas = await this.equipmentAreaRepository.find({
            where: { equipmentId },
            relations: ["area"]
        });

        return equipmentAreas.map(ea => ea.area);
    }

    /**
     * Obtém a área primária de um equipamento
     */
    public async getPrimaryArea(equipmentId: string): Promise<Area | null> {
        const primaryRelation = await this.equipmentAreaRepository.findOne({
            where: { equipmentId, isPrimary: true },
            relations: ["area"]
        });

        return primaryRelation ? primaryRelation.area : null;
    }

    /**
     * Obtém todos os equipamentos em uma área específica
     */
    public async getAreaEquipments(areaId: string): Promise<Equipment[]> {
        const equipmentAreas = await this.equipmentAreaRepository.find({
            where: { areaId },
            relations: ["equipment"]
        });

        return equipmentAreas.map(ea => ea.equipment);
    }

    /**
     * Verifica se um equipamento está em uma área específica
     */
    public async isEquipmentInArea(equipmentId: string, areaId: string): Promise<boolean> {
        const relation = await this.equipmentAreaRepository.findOne({
            where: { equipmentId, areaId }
        });

        return !!relation;
    }

    /**
     * Identifica equipamentos que ficariam com relações inválidas se
     * a relação de vizinhança entre duas áreas fosse removida
     */
    public async getEquipmentImpactedByNeighborRemoval(
        areaId1: string, 
        areaId2: string
    ): Promise<Equipment[]> {
        const equipmentsInArea1 = await this.getAreaEquipments(areaId1);
        const equipmentsInArea2 = await this.getAreaEquipments(areaId2);        
        const area1EquipmentIds = new Set(equipmentsInArea1.map(e => e.id));        
        return equipmentsInArea2.filter(e => area1EquipmentIds.has(e.id));
    }

    /**
     * Valida se o equipamento existe
     */
    private async validateEquipmentExists(equipmentId: string): Promise<Equipment> {
        const equipment = await this.equipmentRepository.findOne({
            where: { id: equipmentId },
            relations: ["areaRelations", "areaRelations.area"]
        });
        
        if (!equipment) {
            throw new EquipmentNotFoundError();
        }
        
        return equipment;
    }

    /**
     * Valida se todas as áreas existem
     */
    private async validateAreasExist(areaIds: string[]): Promise<void> {
        const areas = await this.areaRepository.find({
            where: { id: In(areaIds) }
        });
        
        if (areas.length !== areaIds.length) {
            throw new InvalidForeignKeyError("Uma ou mais áreas não foram encontradas");
        }
    }

    /**
     * Valida se todas as áreas formam um grupo conectado
     */
    private async validateAreasAreConnected(areaIds: string[]): Promise<void> {
        const areConnected = await this.areaNeighborService.areAllConnected(areaIds);
        if (!areConnected) {
            throw new InvalidDataError(
                "Equipamentos só podem ser associados a áreas que são vizinhas entre si"
            );
        }
    }

    /**
     * Valida se a área primária está incluída nas áreas selecionadas
     */
    private validatePrimaryArea(areaIds: string[], primaryAreaId?: string): void {
        if (primaryAreaId && !areaIds.includes(primaryAreaId)) {
            throw new InvalidDataError("A área primária deve estar incluída nas áreas selecionadas");
        }
    }

    /**
     * Atualiza as associações de áreas do equipamento
     */
    private async updateEquipmentAreas(
        equipmentId: string, 
        areaIds: string[], 
        primaryAreaId?: string
    ): Promise<void> {
        await this.equipmentRepository.manager.transaction(async transactionalEntityManager => {
            await transactionalEntityManager.delete(EquipmentArea, {
                equipmentId
            });

            for (const areaId of areaIds) {
                await transactionalEntityManager.save(EquipmentArea, {
                    equipmentId,
                    areaId,
                    isPrimary: areaId === primaryAreaId,
                    assignedSince: new Date()
                });
            }

            if (primaryAreaId) {
                await transactionalEntityManager.update(
                    Equipment, 
                    { id: equipmentId }, 
                    { areaId: primaryAreaId }
                );
            }
        });
    }
}