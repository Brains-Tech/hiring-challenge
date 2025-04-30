// src/services/AreaNeighborService.ts
import { DatabaseContext } from "../config/database-context";
import { Repository, QueryFailedError } from "typeorm";
import { InvalidDataError } from "../errors/InvalidDataError";
import { Area } from "../models/Area";
import { AreaNeighbor } from "../models/AreaNeighbor";

export class AreaNeighborService {
    private areaNeighborRepository: Repository<AreaNeighbor>;
    private areaRepository: Repository<Area>;

    constructor() {
        this.areaNeighborRepository = DatabaseContext.getInstance().getRepository(AreaNeighbor);
        this.areaRepository = DatabaseContext.getInstance().getRepository(Area);
    }

    /**
     * Verifica se duas áreas são vizinhas
     */
    public async areNeighbors(areaId: string, neighborId: string): Promise<boolean> {
        if (areaId === neighborId) {
            return false; // Uma área não pode ser vizinha dela mesma
        }

        const relation = await this.areaNeighborRepository.findOne({
            where: { areaId, neighborId }
        });

        return !!relation;
    }

    /**
     * Encontra todas as áreas vizinhas de uma área específica
     */
    public async findNeighbors(areaId: string): Promise<Area[]> {
        const relations = await this.areaNeighborRepository.find({
            where: { areaId },
            relations: ["neighbor"]
        });

        return relations.map(relation => relation.neighbor);
    }

    /**
     * Estabelece uma relação de vizinhança bidirecional entre duas áreas
     */
    public async createNeighborRelation(areaId: string, neighborId: string, options?: {
        connectionType?: string;
        notes?: string;
        createdBy?: string;
    }): Promise<void> {
        // Validações
        if (areaId === neighborId) {
            throw new InvalidDataError("Uma área não pode ser vizinha dela mesma");
        }

        // Verificar se as áreas existem
        const area = await this.areaRepository.findOne({ where: { id: areaId } });
        if (!area) {
            throw new InvalidDataError(`Área com ID ${areaId} não encontrada`);
        }

        const neighbor = await this.areaRepository.findOne({ where: { id: neighborId } });
        if (!neighbor) {
            throw new InvalidDataError(`Área com ID ${neighborId} não encontrada`);
        }

        // Verificar se a relação já existe
        const existingRelation = await this.areaNeighborRepository.findOne({
            where: { areaId, neighborId }
        });

        if (existingRelation) {
            throw new InvalidDataError("Estas áreas já são vizinhas");
        }

        try {
            // Usar transação para garantir consistência
            await DatabaseContext.getInstance().getRepository(AreaNeighbor).manager.transaction(
                async transactionalEntityManager => {
                    // Criar relação A -> B
                    await transactionalEntityManager.save(AreaNeighbor, {
                        areaId,
                        neighborId,
                        connectionType: options?.connectionType,
                        notes: options?.notes,
                        createdBy: options?.createdBy
                    });

                    // Criar relação B -> A (bidirecionalidade)
                    await transactionalEntityManager.save(AreaNeighbor, {
                        areaId: neighborId,
                        neighborId: areaId,
                        connectionType: options?.connectionType,
                        notes: options?.notes,
                        createdBy: options?.createdBy
                    });
                }
            );
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Erro ao criar relação de vizinhança");
            }
            throw error;
        }
    }

    /**
     * Remove uma relação de vizinhança bidirecional entre duas áreas
     */
    public async removeNeighborRelation(areaId: string, neighborId: string): Promise<void> {
        try {
            // Usar transação para garantir consistência
            await DatabaseContext.getInstance().getRepository(AreaNeighbor).manager.transaction(
                async transactionalEntityManager => {
                    // Remover relação A -> B
                    await transactionalEntityManager.delete(AreaNeighbor, {
                        areaId,
                        neighborId
                    });

                    // Remover relação B -> A (bidirecionalidade)
                    await transactionalEntityManager.delete(AreaNeighbor, {
                        areaId: neighborId,
                        neighborId: areaId
                    });
                }
            );
        } catch (error) {
            throw new InvalidDataError("Erro ao remover relação de vizinhança");
        }
    }

    /**
     * Verifica se um conjunto de áreas formam um grupo conectado (todas são vizinhas entre si)
     */
    public async areAllConnected(areaIds: string[]): Promise<boolean> {
        // Se há apenas uma área ou nenhuma, retorna verdadeiro
        if (areaIds.length <= 1) {
            return true;
        }

        // Para cada par possível de áreas, verificar se são vizinhas
        for (let i = 0; i < areaIds.length; i++) {
            for (let j = i + 1; j < areaIds.length; j++) {
                const areNeighbors = await this.areNeighbors(areaIds[i], areaIds[j]);
                if (!areNeighbors) {
                    return false;
                }
            }
        }

        return true;
    }
}