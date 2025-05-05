// tests/AreaNeighborService.test.ts
import { AreaNeighborService } from "../../src/services/AreaNeighborService";
import { DatabaseContext } from "../../src/config/database-context";
import { Area } from "../../src/models/Area";
import { Repository } from "typeorm";
import { InvalidDataError } from "../../src/errors/InvalidDataError";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AreaNeighbor } from "../../src/models/AreaNeighbor";

jest.mock("../../src/config/database-context");

describe("AreaNeighborService", () => {
    let areaNeighborService: AreaNeighborService;
    let mockAreaNeighborRepository: jest.Mocked<Repository<AreaNeighbor>>;
    let mockAreaRepository: jest.Mocked<Repository<Area>>;
    let mockTransactionManager: any;

    beforeEach(() => {
        mockAreaNeighborRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            manager: {
                transaction: jest.fn()
            }
        } as any;

        mockAreaRepository = {
            findOne: jest.fn()
        } as any;

        mockTransactionManager = {
            save: jest.fn(),
            delete: jest.fn()
        };

        (mockAreaNeighborRepository.manager.transaction as jest.Mock).mockImplementation(
            async (callback: any) => await callback(mockTransactionManager)
        );

        (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
            getRepository: jest.fn().mockImplementation((entity) => {
                if (entity === AreaNeighbor) return mockAreaNeighborRepository;
                if (entity === Area) return mockAreaRepository;
                return null;
            })
        });

        areaNeighborService = new AreaNeighborService();
    });

    describe("areNeighbors", () => {
        it("should return false if areaId equals neighborId", async () => {
            const result = await areaNeighborService.areNeighbors("same-id", "same-id");
            expect(result).toBe(false);
            expect(mockAreaNeighborRepository.findOne).not.toHaveBeenCalled();
        });

        it("should return true when areas are neighbors", async () => {
            mockAreaNeighborRepository.findOne.mockResolvedValue({ areaId: "area1", neighborId: "area2" } as any);
            
            const result = await areaNeighborService.areNeighbors("area1", "area2");
            
            expect(result).toBe(true);
            expect(mockAreaNeighborRepository.findOne).toHaveBeenCalledWith({
                where: { areaId: "area1", neighborId: "area2" }
            });
        });

        it("should return false when areas are not neighbors", async () => {
            mockAreaNeighborRepository.findOne.mockResolvedValue(null);
            
            const result = await areaNeighborService.areNeighbors("area1", "area3");
            
            expect(result).toBe(false);
            expect(mockAreaNeighborRepository.findOne).toHaveBeenCalledWith({
                where: { areaId: "area1", neighborId: "area3" }
            });
        });
    });

    describe("findNeighbors", () => {
        it("should return all neighbors of an area", async () => {
            const mockNeighbors = [
                { area: { id: "area1" }, neighbor: { id: "area2", name: "Area 2" } },
                { area: { id: "area1" }, neighbor: { id: "area3", name: "Area 3" } }
            ];
            
            mockAreaNeighborRepository.find.mockResolvedValue(mockNeighbors as any);
            
            const result = await areaNeighborService.findNeighbors("area1");
            
            expect(result).toEqual([
                { id: "area2", name: "Area 2" },
                { id: "area3", name: "Area 3" }
            ]);
            expect(mockAreaNeighborRepository.find).toHaveBeenCalledWith({
                where: { areaId: "area1" },
                relations: ["neighbor"]
            });
        });
    });

    describe("createNeighborRelation", () => {
        it("should throw error if areaId equals neighborId", async () => {
            await expect(
                areaNeighborService.createNeighborRelation("same-id", "same-id")
            ).rejects.toThrow(InvalidDataError);
            
            expect(mockAreaRepository.findOne).not.toHaveBeenCalled();
        });

        it("should throw error if area doesn't exist", async () => {
            mockAreaRepository.findOne.mockResolvedValue(null);
            
            await expect(
                areaNeighborService.createNeighborRelation("area1", "area2")
            ).rejects.toThrow(InvalidDataError);
            
            expect(mockAreaRepository.findOne).toHaveBeenCalledWith({
                where: { id: "area1" }
            });
        });

        it("should throw error if neighbor doesn't exist", async () => {
            mockAreaRepository.findOne
                .mockResolvedValueOnce({ id: "area1" } as any)
                .mockResolvedValueOnce(null);
            
            await expect(
                areaNeighborService.createNeighborRelation("area1", "area2")
            ).rejects.toThrow(InvalidDataError);
            
            expect(mockAreaRepository.findOne).toHaveBeenNthCalledWith(1, {
                where: { id: "area1" }
            });
            expect(mockAreaRepository.findOne).toHaveBeenNthCalledWith(2, {
                where: { id: "area2" }
            });
        });

        it("should throw error if relation already exists", async () => {
            mockAreaRepository.findOne
                .mockResolvedValueOnce({ id: "area1" } as any)
                .mockResolvedValueOnce({ id: "area2" } as any);
            
            mockAreaNeighborRepository.findOne.mockResolvedValue({ areaId: "area1", neighborId: "area2" } as any);
            
            await expect(
                areaNeighborService.createNeighborRelation("area1", "area2")
            ).rejects.toThrow(InvalidDataError);
            
            expect(mockAreaNeighborRepository.findOne).toHaveBeenCalledWith({
                where: { areaId: "area1", neighborId: "area2" }
            });
        });

        it("should create bidirectional relationship between areas", async () => {
            mockAreaRepository.findOne
                .mockResolvedValueOnce({ id: "area1" } as any)
                .mockResolvedValueOnce({ id: "area2" } as any);
            
            mockAreaNeighborRepository.findOne.mockResolvedValue(null);
            
            await areaNeighborService.createNeighborRelation("area1", "area2", {
                connectionType: "door",
                notes: "test notes"
            });
            
            expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);
            expect(mockTransactionManager.save).toHaveBeenNthCalledWith(1, AreaNeighbor, {
                areaId: "area1",
                neighborId: "area2",
                connectionType: "door",
                notes: "test notes"
            });
            expect(mockTransactionManager.save).toHaveBeenNthCalledWith(2, AreaNeighbor, {
                areaId: "area2",
                neighborId: "area1",
                connectionType: "door",
                notes: "test notes"
            });
        });
    });

    describe("removeNeighborRelation", () => {
        it("should remove bidirectional relationship between areas", async () => {
            await areaNeighborService.removeNeighborRelation("area1", "area2");
            
            expect(mockTransactionManager.delete).toHaveBeenCalledTimes(2);
            expect(mockTransactionManager.delete).toHaveBeenNthCalledWith(1, AreaNeighbor, {
                areaId: "area1",
                neighborId: "area2"
            });
            expect(mockTransactionManager.delete).toHaveBeenNthCalledWith(2, AreaNeighbor, {
                areaId: "area2",
                neighborId: "area1"
            });
        });
    });

    describe("areAllConnected", () => {
        it("should return true for empty array or single element", async () => {
            expect(await areaNeighborService.areAllConnected([])).toBe(true);
            expect(await areaNeighborService.areAllConnected(["area1"])).toBe(true);
        });

        it("should return true when all areas are neighbors", async () => {
            // Mock to make all areas neighbors of each other
            jest.spyOn(areaNeighborService, 'areNeighbors').mockResolvedValue(true);
            
            const result = await areaNeighborService.areAllConnected(["area1", "area2", "area3"]);
            
            expect(result).toBe(true);
            // Should check 3 pairs: (area1-area2), (area1-area3), (area2-area3)
            expect(areaNeighborService.areNeighbors).toHaveBeenCalledTimes(3);
        });

        it("should return false when at least one pair of areas are not neighbors", async () => {
            // Mock to make specific areas not neighbors
            jest.spyOn(areaNeighborService, 'areNeighbors')
                .mockImplementation(async (areaId, neighborId) => {
                    if (areaId === "area1" && neighborId === "area3" || 
                        areaId === "area3" && neighborId === "area1") {
                        return false;
                    }
                    return true;
                });
            
            const result = await areaNeighborService.areAllConnected(["area1", "area2", "area3"]);
            
            expect(result).toBe(false);
        });
    });
});