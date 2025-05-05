import { AreaService } from "../../src/services/AreaService";
import { DatabaseContext } from "../../src/config/database-context";
import { Area } from "../../src/models/Area";
import { Repository, QueryFailedError } from "typeorm";
import { AreaNotFoundError } from "../../src/errors/AreaNotFoundError";
import { InvalidForeignKeyError } from "../../src/errors/InvalidForeignKeyError";
import { InvalidDataError } from "../../src/errors/InvalidDataError";
import { DependencyExistsError } from "../../src/errors/DependencyExistsError";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../../src/config/database-context");

describe("AreaService", () => {
    let areaService: AreaService;
    let mockRepository: jest.Mocked<Repository<Area>>;

    // Helper function to create a mock Area with all required properties
    const createMockArea = (overrides = {}) => {
        return {
            id: "1",
            name: "Area 1",
            locationDescription: "Location 1",
            plantId: "plant1",
            plant: undefined,
            // Added properties from the updated Area model
            neighborRelations: [],
            neighboredByRelations: [],
            equipmentRelations: [],
            getNeighborCount: jest.fn().mockReturnValue(0),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        } as unknown as Area;
    };

    // Helper function to create area data for creation/update
    const createAreaData = (overrides = {}) => {
        return {
            name: "New Area",
            locationDescription: "Location 1",
            plantId: "plant1",
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
            remove: jest.fn()
        } as any;

        (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
            getRepository: jest.fn().mockReturnValue(mockRepository)
        });

        areaService = new AreaService();
    });

    describe("findAll", () => {
        it("should return all areas with their relations", async () => {
            const mockAreas = [createMockArea()];
            mockRepository.find.mockResolvedValue(mockAreas);

            const result = await areaService.findAll();

            expect(result).toEqual(mockAreas);
            expect(mockRepository.find).toHaveBeenCalledWith({
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
        });
    });

    describe("findById", () => {
        it("should return an area when found", async () => {
            const mockArea = createMockArea();
            mockRepository.findOne.mockResolvedValue(mockArea);

            const result = await areaService.findById("1");

            expect(result).toEqual(mockArea);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: "1" },
                relations: ["plant", "equipment", "equipment.parts"]
            });
        });

        it("should throw AreaNotFoundError when area doesn't exist", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(areaService.findById("1"))
                .rejects
                .toThrow(AreaNotFoundError);
        });
    });

    describe("create", () => {
        it("should create and return a new area", async () => {
            const areaData = createAreaData();
            const mockArea = createMockArea(areaData);
            
            mockRepository.create.mockReturnValue(mockArea);
            mockRepository.save.mockResolvedValue(mockArea);
            mockRepository.findOne.mockResolvedValue(mockArea);

            const result = await areaService.create(areaData);

            expect(result).toEqual(mockArea);
            expect(mockRepository.create).toHaveBeenCalledWith(areaData);
            expect(mockRepository.save).toHaveBeenCalledWith(mockArea);
        });

        it("should throw InvalidForeignKeyError when save fails with foreign key error", async () => {
            const areaData = createAreaData();
            const mockArea = createMockArea(areaData);
            
            mockRepository.create.mockReturnValue(mockArea);
            mockRepository.save.mockRejectedValue(createQueryFailedError("FOREIGN KEY"));

            await expect(areaService.create(areaData))
                .rejects
                .toThrow(InvalidForeignKeyError);
        });

        it("should throw InvalidDataError when save fails with other QueryFailedError", async () => {
            const areaData = createAreaData();
            const mockArea = createMockArea(areaData);
            
            mockRepository.create.mockReturnValue(mockArea);
            mockRepository.save.mockRejectedValue(createQueryFailedError("error"));

            await expect(areaService.create(areaData))
                .rejects
                .toThrow(InvalidDataError);
        });
    });

    describe("update", () => {
        const areaId = "1";
        const updateData = { name: "Updated Area" };

        it("should update and return the area", async () => {
            const existingArea = createMockArea();
            const updatedArea = createMockArea({ ...existingArea, ...updateData });
            
            mockRepository.findOne.mockResolvedValue(existingArea);
            mockRepository.save.mockResolvedValue(updatedArea);

            const result = await areaService.update(areaId, updateData);

            expect(result).toEqual(updatedArea);
            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                ...existingArea,
                ...updateData
            }));
        });

        it("should throw AreaNotFoundError when area doesn't exist", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(areaService.update(areaId, updateData))
                .rejects
                .toThrow(AreaNotFoundError);
        });

        it("should throw InvalidDataError when save fails with QueryFailedError", async () => {
            const existingArea = createMockArea();
            
            mockRepository.findOne.mockResolvedValue(existingArea);
            mockRepository.save.mockRejectedValue(createQueryFailedError("error"));

            await expect(areaService.update(areaId, updateData))
                .rejects
                .toThrow(InvalidDataError);
        });
    });

    describe("delete", () => {
        const areaId = "1";

        it("should delete the area successfully", async () => {
            const mockArea = createMockArea({ id: areaId });
            
            mockRepository.findOne.mockResolvedValue(mockArea);
            mockRepository.remove.mockResolvedValue(mockArea);

            await areaService.delete(areaId);

            expect(mockRepository.remove).toHaveBeenCalledWith(mockArea);
        });

        it("should throw AreaNotFoundError when area doesn't exist", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(areaService.delete(areaId))
                .rejects
                .toThrow(AreaNotFoundError);
        });

        it("should throw DependencyExistsError when delete fails with QueryFailedError", async () => {
            const mockArea = createMockArea({ id: areaId });
            
            mockRepository.findOne.mockResolvedValue(mockArea);
            mockRepository.remove.mockRejectedValue(createQueryFailedError("error"));

            await expect(areaService.delete(areaId))
                .rejects
                .toThrow(DependencyExistsError);
        });
    });
});