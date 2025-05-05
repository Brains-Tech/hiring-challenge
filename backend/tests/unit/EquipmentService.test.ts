import { EquipmentService } from "../../src/services/EquipmentService";
import { DatabaseContext } from "../../src/config/database-context";
import { Equipment } from "../../src/models/Equipment";
import { Repository, QueryFailedError } from "typeorm";
import { EquipmentNotFoundError } from "../../src/errors/EquipmentNotFoundError";
import { InvalidForeignKeyError } from "../../src/errors/InvalidForeignKeyError";
import { InvalidDataError } from "../../src/errors/InvalidDataError";
import { DependencyExistsError } from "../../src/errors/DependencyExistsError";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EquipmentAreaService } from "../../src/services/EquipmentAreaService";

jest.mock("../../src/config/database-context");
jest.mock("../../src/services/EquipmentAreaService");

describe("EquipmentService", () => {
    let equipmentService: EquipmentService;
    let mockRepository: jest.Mocked<Repository<Equipment>>;
    let mockEquipmentAreaService: jest.Mocked<EquipmentAreaService>;

    // Helper function to create a mock Equipment
    const createMockEquipment = (overrides = {}) => {
        return {
            id: "1",
            name: "Equipment 1",
            manufacturer: "Test Manufacturer",
            serialNumber: "123456",
            initialOperationsDate: new Date(),
            areaId: "area1",
            areaRelations: [], // Required in the updated model
            parts: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    };

    // Helper function to create equipment data for creation/update
    const createEquipmentData = (overrides = {}) => {
        return {
            name: "New Equipment",
            manufacturer: "Test Manufacturer",
            serialNumber: "123456",
            initialOperationsDate: new Date(),
            areaId: "area1",
            areaRelations: [],
            ...overrides
        };
    };

    // Helper function to create a mock QueryFailedError
    const createQueryFailedError = (message: string) => {
        return new QueryFailedError("query", undefined, new Error(message));
    };

    beforeEach(() => {
        mockRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            manager: {
                transaction: jest.fn()
            }
        } as any;

        mockEquipmentAreaService = {
            assignEquipmentToAreas: jest.fn(),
            getEquipmentAreas: jest.fn(),
            getPrimaryArea: jest.fn(),
            getAreaEquipments: jest.fn()
        } as any;

        (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
            getRepository: jest.fn().mockReturnValue(mockRepository)
        });

        equipmentService = new EquipmentService();
        // Set the mock EquipmentAreaService
        (equipmentService as any).equipmentAreaService = mockEquipmentAreaService;
    });

    describe("findAll", () => {
        it("should return all equipment with their relations", async () => {
            const mockEquipment = [createMockEquipment()];
            mockRepository.find.mockResolvedValue(mockEquipment);

            const result = await equipmentService.findAll();

            expect(result).toEqual(mockEquipment);
            expect(mockRepository.find).toHaveBeenCalledWith({
                relations: ["area", "parts", "areaRelations", "areaRelations.area"]
            });
        });
    });

    describe("findById", () => {
        it("should return equipment when found", async () => {
            const mockEquipment = createMockEquipment();
            mockRepository.findOne.mockResolvedValue(mockEquipment);

            const result = await equipmentService.findById("1");

            expect(result).toEqual(mockEquipment);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: "1" },
                relations: ["area", "parts"]
            });
        });

        it("should throw EquipmentNotFoundError when equipment doesn't exist", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(equipmentService.findById("1"))
                .rejects
                .toThrow(EquipmentNotFoundError);
        });
    });

    describe("create", () => {
        it("should create and return new equipment", async () => {
            const equipmentData = createEquipmentData();
            const mockEquipment = createMockEquipment(equipmentData);
            
            mockRepository.create.mockReturnValue(mockEquipment);
            mockRepository.save.mockResolvedValue(mockEquipment);
            mockRepository.findOne.mockResolvedValue(mockEquipment);

            const result = await equipmentService.create(equipmentData);

            expect(result).toEqual(mockEquipment);
            expect(mockRepository.create).toHaveBeenCalledWith(equipmentData);
            expect(mockRepository.save).toHaveBeenCalledWith(mockEquipment);
        });

        it("should throw InvalidForeignKeyError when save fails with foreign key error", async () => {
            const equipmentData = createEquipmentData();
            const mockEquipment = createMockEquipment(equipmentData);
            
            mockRepository.create.mockReturnValue(mockEquipment);
            mockRepository.save.mockRejectedValue(createQueryFailedError("FOREIGN KEY"));

            await expect(equipmentService.create(equipmentData))
                .rejects
                .toThrow(InvalidForeignKeyError);
        });

        it("should throw InvalidDataError when save fails with other QueryFailedError", async () => {
            const equipmentData = createEquipmentData();
            const mockEquipment = createMockEquipment(equipmentData);
            
            mockRepository.create.mockReturnValue(mockEquipment);
            mockRepository.save.mockRejectedValue(createQueryFailedError("error"));

            await expect(equipmentService.create(equipmentData))
                .rejects
                .toThrow(InvalidDataError);
        });
    });

    describe("update", () => {
        const equipmentId = "1";
        const updateData = { name: "Updated Equipment" };

        it("should update and return the equipment", async () => {
            const existingEquipment = createMockEquipment();
            const updatedEquipment = createMockEquipment({ ...existingEquipment, ...updateData });
            
            mockRepository.findOne.mockResolvedValue(existingEquipment);
            mockRepository.save.mockResolvedValue(updatedEquipment);

            const result = await equipmentService.update(equipmentId, updateData);

            expect(result).toEqual(updatedEquipment);
            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                ...existingEquipment,
                ...updateData
            }));
        });

        it("should throw EquipmentNotFoundError when equipment doesn't exist", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(equipmentService.update(equipmentId, updateData))
                .rejects
                .toThrow(EquipmentNotFoundError);
        });

        it("should throw InvalidForeignKeyError when save fails with foreign key error", async () => {
            const existingEquipment = createMockEquipment();
            
            mockRepository.findOne.mockResolvedValue(existingEquipment);
            mockRepository.save.mockRejectedValue(createQueryFailedError("FOREIGN KEY"));

            await expect(equipmentService.update(equipmentId, updateData))
                .rejects
                .toThrow(InvalidForeignKeyError);
        });

        it("should throw InvalidDataError when save fails with other QueryFailedError", async () => {
            const existingEquipment = createMockEquipment();
            
            mockRepository.findOne.mockResolvedValue(existingEquipment);
            mockRepository.save.mockRejectedValue(createQueryFailedError("error"));

            await expect(equipmentService.update(equipmentId, updateData))
                .rejects
                .toThrow(InvalidDataError);
        });
    });

    describe("delete", () => {
        const equipmentId = "1";

        it("should delete the equipment successfully", async () => {
            const mockEquipment = createMockEquipment({ id: equipmentId });
            
            mockRepository.findOne.mockResolvedValue(mockEquipment);
            mockRepository.remove.mockResolvedValue(mockEquipment);

            await equipmentService.delete(equipmentId);

            expect(mockRepository.remove).toHaveBeenCalledWith(mockEquipment);
        });

        it("should throw EquipmentNotFoundError when equipment doesn't exist", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(equipmentService.delete(equipmentId))
                .rejects
                .toThrow(EquipmentNotFoundError);
        });

        it("should throw DependencyExistsError when delete fails with QueryFailedError", async () => {
            const mockEquipment = createMockEquipment({ id: equipmentId });
            
            mockRepository.findOne.mockResolvedValue(mockEquipment);
            mockRepository.remove.mockRejectedValue(createQueryFailedError("error"));

            await expect(equipmentService.delete(equipmentId))
                .rejects
                .toThrow(DependencyExistsError);
        });
    });

    describe("assignToAreas", () => {
        const equipmentId = "1";
        const areaIds = ["area1", "area2"];
        const primaryAreaId = "area1";

        it("should assign equipment to areas and return updated equipment", async () => {
            const mockEquipment = createMockEquipment({ id: equipmentId });
            
            mockEquipmentAreaService.assignEquipmentToAreas.mockResolvedValue(undefined);
            mockRepository.findOne.mockResolvedValue(mockEquipment);

            const result = await equipmentService.assignToAreas(equipmentId, areaIds, primaryAreaId);

            expect(result).toEqual(mockEquipment);
            expect(mockEquipmentAreaService.assignEquipmentToAreas).toHaveBeenCalledWith(
                equipmentId, areaIds, primaryAreaId
            );
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: equipmentId },
                relations: ["area", "parts"]
            });
        });

        it("should throw EquipmentNotFoundError when equipment doesn't exist during retrieval", async () => {
            mockEquipmentAreaService.assignEquipmentToAreas.mockResolvedValue(undefined);
            mockRepository.findOne.mockResolvedValue(null);

            await expect(equipmentService.assignToAreas(equipmentId, areaIds, primaryAreaId))
                .rejects
                .toThrow(EquipmentNotFoundError);
        });

        it("should propagate errors from equipmentAreaService.assignEquipmentToAreas", async () => {
            mockEquipmentAreaService.assignEquipmentToAreas.mockRejectedValue(new InvalidDataError("test error"));

            await expect(equipmentService.assignToAreas(equipmentId, areaIds, primaryAreaId))
                .rejects
                .toThrow(InvalidDataError);
        });
    });

    describe("getEquipmentAreas", () => {
        const equipmentId = "1";
        const mockAreas = [{ id: "area1", name: "Area 1" }, { id: "area2", name: "Area 2" }];

        it("should return areas for the equipment", async () => {
            mockEquipmentAreaService.getEquipmentAreas.mockResolvedValue(mockAreas);

            const result = await equipmentService.getEquipmentAreas(equipmentId);

            expect(result).toEqual(mockAreas);
            expect(mockEquipmentAreaService.getEquipmentAreas).toHaveBeenCalledWith(equipmentId);
        });
    });

    describe("findByArea", () => {
        const areaId = "area1";
        const mockEquipmentList = [createMockEquipment()];

        it("should return equipment for the area", async () => {
            mockEquipmentAreaService.getAreaEquipments.mockResolvedValue(mockEquipmentList);

            const result = await equipmentService.findByArea(areaId);

            expect(result).toEqual(mockEquipmentList);
            expect(mockEquipmentAreaService.getAreaEquipments).toHaveBeenCalledWith(areaId);
        });
    });
});