// tests/EquipmentAreaService.test.ts
import { EquipmentAreaService } from "../../src/services/EquipmentAreaService";
import { DatabaseContext } from "../../src/config/database-context";
import { EquipmentArea } from "../../src/models/EquipmentArea";
import { Equipment } from "../../src/models/Equipment";
import { Area } from "../../src/models/Area";
import { Repository, In } from "typeorm";
import { AreaNeighborService } from "../../src/services/AreaNeighborService";
import { EquipmentNotFoundError } from "../../src/errors/EquipmentNotFoundError";
import { InvalidForeignKeyError } from "../../src/errors/InvalidForeignKeyError";
import { InvalidDataError } from "../../src/errors/InvalidDataError";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../../src/config/database-context");
jest.mock("../../src/services/AreaNeighborService");

describe("EquipmentAreaService", () => {
    let equipmentAreaService: EquipmentAreaService;
    let mockEquipmentAreaRepository: jest.Mocked<Repository<EquipmentArea>>;
    let mockEquipmentRepository: jest.Mocked<Repository<Equipment>>;
    let mockAreaRepository: jest.Mocked<Repository<Area>>;
    let mockAreaNeighborService: jest.Mocked<AreaNeighborService>;
    let mockTransactionManager: any;

    beforeEach(() => {
        mockEquipmentAreaRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn()
        } as any;

        mockEquipmentRepository = {
            findOne: jest.fn(),
            manager: {
                transaction: jest.fn(),
                delete: jest.fn(),
                save: jest.fn(),
                update: jest.fn()
            }
        } as any;

        mockAreaRepository = {
            find: jest.fn()
        } as any;

        mockAreaNeighborService = {
            areAllConnected: jest.fn()
        } as any;

        mockTransactionManager = {
            delete: jest.fn(),
            save: jest.fn(),
            update: jest.fn()
        };

        (mockEquipmentRepository.manager.transaction as jest.Mock).mockImplementation(
            async (callback) => await callback(mockTransactionManager)
        );

        (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
            getRepository: jest.fn().mockImplementation((entity) => {
                if (entity === EquipmentArea) return mockEquipmentAreaRepository;
                if (entity === Equipment) return mockEquipmentRepository;
                if (entity === Area) return mockAreaRepository;
                return null;
            })
        });

        (AreaNeighborService as jest.Mock).mockImplementation(() => {
            return mockAreaNeighborService;
        });

        equipmentAreaService = new EquipmentAreaService();
    });

    describe("assignEquipmentToAreas", () => {
        it("should throw error if equipment doesn't exist", async () => {
            mockEquipmentRepository.findOne.mockResolvedValue(null);
            
            await expect(
                equipmentAreaService.assignEquipmentToAreas("equip1", ["area1", "area2"])
            ).rejects.toThrow(EquipmentNotFoundError);
            
            expect(mockEquipmentRepository.findOne).toHaveBeenCalledWith({
                where: { id: "equip1" },
                relations: ["areaRelations", "areaRelations.area"]
            });
        });

        it("should throw error if any area doesn't exist", async () => {
            mockEquipmentRepository.findOne.mockResolvedValue({ id: "equip1" } as any);
            
            // Only one area exists
            mockAreaRepository.find.mockResolvedValue([{ id: "area1" }] as any);
            
            await expect(
                equipmentAreaService.assignEquipmentToAreas("equip1", ["area1", "area2"])
            ).rejects.toThrow(InvalidForeignKeyError);
            
            expect(mockAreaRepository.find).toHaveBeenCalledWith({
                where: { id: In(["area1", "area2"]) }
            });
        });

        it("should throw error if areas are not all connected", async () => {
            mockEquipmentRepository.findOne.mockResolvedValue({ id: "equip1" } as any);
            mockAreaRepository.find.mockResolvedValue([
                { id: "area1" },
                { id: "area2" }
            ] as any);
            
            // Areas are not all connected
            mockAreaNeighborService.areAllConnected.mockResolvedValue(false);
            
            await expect(
                equipmentAreaService.assignEquipmentToAreas("equip1", ["area1", "area2"])
            ).rejects.toThrow(InvalidDataError);
            
            expect(mockAreaNeighborService.areAllConnected).toHaveBeenCalledWith(["area1", "area2"]);
        });

        it("should throw error if primaryAreaId is not in areaIds", async () => {
            mockEquipmentRepository.findOne.mockResolvedValue({ id: "equip1" } as any);
            mockAreaRepository.find.mockResolvedValue([
                { id: "area1" },
                { id: "area2" }
            ] as any);
            mockAreaNeighborService.areAllConnected.mockResolvedValue(true);
            
            await expect(
                equipmentAreaService.assignEquipmentToAreas("equip1", ["area1", "area2"], "area3")
            ).rejects.toThrow(InvalidDataError);
        });

        it("should successfully assign equipment to areas", async () => {
            mockEquipmentRepository.findOne.mockResolvedValue({ id: "equip1" } as any);
            mockAreaRepository.find.mockResolvedValue([
                { id: "area1" },
                { id: "area2" }
            ] as any);
            mockAreaNeighborService.areAllConnected.mockResolvedValue(true);
            
            await equipmentAreaService.assignEquipmentToAreas("equip1", ["area1", "area2"], "area1");
            
            // Should delete existing relationships
            expect(mockTransactionManager.delete).toHaveBeenCalledWith(EquipmentArea, {
                equipmentId: "equip1"
            });
            
            // Should create new relationships
            expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);
            expect(mockTransactionManager.save).toHaveBeenNthCalledWith(1, EquipmentArea, expect.objectContaining({
                equipmentId: "equip1",
                areaId: "area1",
                isPrimary: true
            }));
            expect(mockTransactionManager.save).toHaveBeenNthCalledWith(2, EquipmentArea, expect.objectContaining({
                equipmentId: "equip1",
                areaId: "area2",
                isPrimary: false
            }));
            
            // Should update areaId for compatibility
            expect(mockTransactionManager.update).toHaveBeenCalledWith(
                Equipment,
                { id: "equip1" },
                { areaId: "area1" }
            );
        });
    });

    describe("getEquipmentAreas", () => {
        it("should return all areas of an equipment", async () => {
            const mockEquipmentAreas = [
                { area: { id: "area1", name: "Area 1" } },
                { area: { id: "area2", name: "Area 2" } }
            ];
            
            mockEquipmentAreaRepository.find.mockResolvedValue(mockEquipmentAreas as any);
            
            const result = await equipmentAreaService.getEquipmentAreas("equip1");
            
            expect(result).toEqual([
                { id: "area1", name: "Area 1" },
                { id: "area2", name: "Area 2" }
            ]);
            expect(mockEquipmentAreaRepository.find).toHaveBeenCalledWith({
                where: { equipmentId: "equip1" },
                relations: ["area"]
            });
        });
    });

    describe("getAreaEquipments", () => {
        it("should return all equipment in an area", async () => {
            const mockEquipmentAreas = [
                { equipment: { id: "equip1", name: "Equipment 1" } },
                { equipment: { id: "equip2", name: "Equipment 2" } }
            ];
            
            mockEquipmentAreaRepository.find.mockResolvedValue(mockEquipmentAreas as any);
            
            const result = await equipmentAreaService.getAreaEquipments("area1");
            
            expect(result).toEqual([
                { id: "equip1", name: "Equipment 1" },
                { id: "equip2", name: "Equipment 2" }
            ]);
            expect(mockEquipmentAreaRepository.find).toHaveBeenCalledWith({
                where: { areaId: "area1" },
                relations: ["equipment"]
            });
        });
    });

    describe("getEquipmentImpactedByNeighborRemoval", () => {
        it("should find equipment that would be impacted by removing a neighbor relationship", async () => {
            // Mock equipment in area1
            const equipInArea1 = [
                { id: "equip1", name: "Equipment 1" },
                { id: "equip2", name: "Equipment 2" },
                { id: "equip3", name: "Equipment 3" }
            ];
            
            // Mock equipment in area2
            const equipInArea2 = [
                { id: "equip2", name: "Equipment 2" }, // Common with area1
                { id: "equip3", name: "Equipment 3" }, // Common with area1
                { id: "equip4", name: "Equipment 4" }  // Only in area2
            ];
            
            // Setup mocks
            jest.spyOn(equipmentAreaService, 'getAreaEquipments')
                .mockResolvedValueOnce(equipInArea1 as any)
                .mockResolvedValueOnce(equipInArea2 as any);
            
            // Call the method
            const result = await equipmentAreaService.getEquipmentImpactedByNeighborRemoval("area1", "area2");
            
            // Should return equipment in both areas
            expect(result).toEqual([
                { id: "equip2", name: "Equipment 2" },
                { id: "equip3", name: "Equipment 3" }
            ]);
            
            // Should have called getAreaEquipments for both areas
            expect(equipmentAreaService.getAreaEquipments).toHaveBeenCalledTimes(2);
            expect(equipmentAreaService.getAreaEquipments).toHaveBeenNthCalledWith(1, "area1");
            expect(equipmentAreaService.getAreaEquipments).toHaveBeenNthCalledWith(2, "area2");
        });
    });
});