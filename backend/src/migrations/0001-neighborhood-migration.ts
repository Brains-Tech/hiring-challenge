// src/migrations/neighborhoodMigration.ts
import { DataSource } from "typeorm";
import { Equipment } from "../models/Equipment";
import { EquipmentArea } from "../models/EquipmentArea";

export async function migrateToNeighborhood(dataSource: DataSource): Promise<void> {
    console.log("Iniciando migração para o novo modelo de vizinhança...");

    // Obter todos os equipamentos existentes
    const equipments = await dataSource.getRepository(Equipment).find({
        where: { areaId: dataSource.createQueryBuilder().subQuery().select("id").from("area", "a").getQuery() }
    });

    console.log(`Encontrados ${equipments.length} equipamentos para migrar.`);

    // Para cada equipamento, criar uma entrada na tabela EquipmentArea
    for (const equipment of equipments) {
        if (equipment.areaId) {
            try {
                await dataSource.getRepository(EquipmentArea).save({
                    equipmentId: equipment.id,
                    areaId: equipment.areaId,
                    isPrimary: true,
                    assignedSince: equipment.createdAt,
                    notes: "Migração automática do modelo antigo"
                });
                console.log(`Migrado equipamento ${equipment.id} para área ${equipment.areaId}`);
            } catch (error) {
                console.error(`Erro ao migrar equipamento ${equipment.id}:`, error);
            }
        }
    }

    console.log("Migração concluída.");
}