import { MaintenanceService } from "../../src/services/MaintenanceService";
import { DatabaseContext } from "../../src/config/database-context";
import { Maintenance } from "../../src/models/Maintenance";
import { Part } from "../../src/models/Part";
import { Repository } from "typeorm";
import { MaintenanceRecurrenceEnum } from "../../src/models/Maintenance";
import { describe, it, beforeEach, expect, jest } from "@jest/globals";
// import { CreateUpdateMaintenanceDTO } from "../../src/dtos/CreateUpdateMaintenance.dto";


jest.mock("../../src/config/database-context");

describe("MaintenanceService", () => {
    let maintenanceService: MaintenanceService;
    let mockMaintenanceRepo: jest.Mocked<Repository<Maintenance>>;
    let mockPartRepo: jest.Mocked<Repository<Part>>;

    beforeEach(() => {
        mockMaintenanceRepo = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),

        } as any;

        mockPartRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),

        } as any;

        (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
            getRepository: (entity: any) => {
                if (entity === Maintenance) {
                    return mockMaintenanceRepo;
                } else if (entity === Part) {
                    return mockPartRepo;
                }
                throw new Error("Unknown entity");
            },
        });

        maintenanceService = new MaintenanceService();
    });


    describe("findAll", () => {
        it("should return a list of formatted maintenances", async () => {
            const mockMaintenance: any = {
                id: "1",
                title: "Check Motor",
                recurrence: MaintenanceRecurrenceEnum.MONTHLY,
                dueDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                description: "Monthly check",
                scheduledDate: new Date(),
                part: {
                    id: "p1",
                    name: "Motor",
                    installationDate: new Date(),
                    equipment: {
                        id: "eq1",
                        name: "Machine 1",
                        initialOperationsDate: new Date(),
                        area: {
                            id: "a1",
                            name: "Area 1",
                            plant: {
                                id: "pl1",
                                name: "Plant 1",
                            },
                        },
                    },
                },
            };

            mockMaintenanceRepo.find.mockResolvedValue([mockMaintenance]);

            const result = await maintenanceService.findAll();

            expect(result).toEqual([
                {
                    id: mockMaintenance.id,
                    title: mockMaintenance.title,
                    recurrence: mockMaintenance.recurrence,
                    dueDate: mockMaintenance.dueDate,
                    createdAt: mockMaintenance.createdAt,
                    updatedAt: mockMaintenance.updatedAt,
                    description: mockMaintenance.description,
                    scheduledDate: mockMaintenance.scheduledDate,
                    part: {
                        id: mockMaintenance.part.id,
                        name: mockMaintenance.part.name,
                        installationDate: mockMaintenance.part.installationDate,
                    },
                    equipment: {
                        id: mockMaintenance.part.equipment.id,
                        name: mockMaintenance.part.equipment.name,
                        initialOperationsDate: mockMaintenance.part.equipment.initialOperationsDate,
                    },
                    area: {
                        id: mockMaintenance.part.equipment.area.id,
                        name: mockMaintenance.part.equipment.area.name,
                    },
                    plant: {
                        id: mockMaintenance.part.equipment.area.plant.id,
                        name: mockMaintenance.part.equipment.area.plant.name,
                    },
                },
            ]);

            expect(mockMaintenanceRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        dueDate: expect.any(Object),
                    }),
                })
            );

        });


        it("should return an empty list when no maintenances are found", async () => {
            mockMaintenanceRepo.find.mockResolvedValue([]);

            const result = await maintenanceService.findAll();

            expect(result).toEqual([]);
            expect(mockMaintenanceRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        dueDate: expect.any(Object),
                    }),
                })
            );
        });



        it("should throw an error if the repository throws", async () => {
            mockMaintenanceRepo.find.mockRejectedValue(new Error("Database error"));

            await expect(maintenanceService.findAll()).rejects.toThrow("Database error");

            expect(mockMaintenanceRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        dueDate: expect.any(Object),
                    }),
                })
            );
        });
    })


    describe("findById", () => {
        it("should return a maintenance by ID", async () => {
            const mockMaintenance: any = {
                id: "1",
                title: "Check Motor",
                recurrence: MaintenanceRecurrenceEnum.MONTHLY,
                dueDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                description: "Monthly check",
                scheduledDate: new Date(),
                part: {
                    id: "p1",
                    name: "Motor",
                    installationDate: new Date(),
                    equipment: {
                        id: "eq1",
                        name: "Machine 1",
                        initialOperationsDate: new Date(),
                        area: {
                            id: "a1",
                            name: "Area 1",
                            plant: {
                                id: "pl1",
                                name: "Plant 1",
                            },
                        },
                    },
                },
            };

            (mockMaintenanceRepo.findOne as any)?.mockResolvedValue(mockMaintenance);

            const result = await maintenanceService.findById("1");

            expect(result).toEqual({
                id: mockMaintenance.id,
                title: mockMaintenance.title,
                recurrence: mockMaintenance.recurrence,
                dueDate: mockMaintenance.dueDate,
                createdAt: mockMaintenance.createdAt,
                updatedAt: mockMaintenance.updatedAt,
                description: mockMaintenance.description,
                scheduledDate: mockMaintenance.scheduledDate,
                part: {
                    id: mockMaintenance.part.id,
                    name: mockMaintenance.part.name,
                    installationDate: mockMaintenance.part.installationDate,
                },
                equipment: {
                    id: mockMaintenance.part.equipment.id,
                    name: mockMaintenance.part.equipment.name,
                    initialOperationsDate: mockMaintenance.part.equipment.initialOperationsDate,
                },
                area: {
                    id: mockMaintenance.part.equipment.area.id,
                    name: mockMaintenance.part.equipment.area.name,
                },
                plant: {
                    id: mockMaintenance.part.equipment.area.plant.id,
                    name: mockMaintenance.part.equipment.area.plant.name,
                },
            });


            expect(mockMaintenanceRepo.findOne).toHaveBeenCalledWith({
                where: { id: "1" },
                relations: [
                    "part",
                    "part.equipment",
                    "part.equipment.area",
                    "part.equipment.area.plant",
                ],
            });
        });

        it("should throw MaintenanceNotFoundError if maintenance not found", async () => {
            mockMaintenanceRepo.findOne!.mockResolvedValue(null);

            await expect(maintenanceService.findById("1")).rejects.toThrow("Maintenance not found");

            expect(mockMaintenanceRepo.findOne).toHaveBeenCalledWith({
                where: { id: "1" },
                relations: [
                    "part",
                    "part.equipment",
                    "part.equipment.area",
                    "part.equipment.area.plant",
                ],
            });
        });

        it("should throw any error thrown by repository", async () => {
            const dbError = new Error("Database error");
            mockMaintenanceRepo.findOne!.mockRejectedValue(dbError);

            await expect(maintenanceService.findById("1")).rejects.toThrow("Database error");

            expect(mockMaintenanceRepo.findOne).toHaveBeenCalledWith({
                where: { id: "1" },
                relations: [
                    "part",
                    "part.equipment",
                    "part.equipment.area",
                    "part.equipment.area.plant",
                ],
            });
        });
    });



    describe("create", () => {
        it("should create a new maintenance", async () => {

            const mockPart = {
                id: "p1",
                name: "Part A",
                installationDate: new Date("2024-01-01"),
                equipment: {
                    id: "eq1",
                    name: "Equipment A",
                    initialOperationsDate: new Date("2024-01-01"),
                    area: {
                        id: "a1",
                        name: "Area 1",
                        plant: {
                            id: "pl1",
                            name: "Plant 1",
                        },
                    },
                },
            } as any;

            const inputData = {
                title: "Check Pump",
                description: "Routine check",
                recurrence: MaintenanceRecurrenceEnum.MONTHLY,
                partId: "p1",
            };

            const calculatedDueDate = new Date("2024-02-01");

            const mockSavedMaintenance = {
                id: "m1",
                ...inputData,
                dueDate: calculatedDueDate,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            const mockFormattedMaintenance = {
                id: "m1",
                title: inputData.title,
                recurrence: inputData.recurrence,
                dueDate: calculatedDueDate,
                createdAt: new Date(),
                updatedAt: new Date(),
                description: inputData.description,
                scheduledDate: undefined,
                part: {
                    id: mockPart.id,
                    name: mockPart.name,
                    installationDate: mockPart.installationDate,
                },
                equipment: {
                    id: mockPart.equipment.id,
                    name: mockPart.equipment.name,
                    initialOperationsDate: mockPart.equipment.initialOperationsDate,
                },
                area: {
                    id: mockPart.equipment.area.id,
                    name: mockPart.equipment.area.name,
                },
                plant: {
                    id: mockPart.equipment.area.plant.id,
                    name: mockPart.equipment.area.plant.name,
                },
            };

            mockPartRepo.findOne!.mockResolvedValue(mockPart);
            mockMaintenanceRepo.create!.mockReturnValue(mockSavedMaintenance);
            mockMaintenanceRepo.save!.mockResolvedValue(mockSavedMaintenance);
            mockMaintenanceRepo.findOne!.mockResolvedValueOnce({
                ...mockSavedMaintenance,
                part: mockPart,
            });

            const result = await maintenanceService.create(inputData);

            expect(result).toMatchObject(mockFormattedMaintenance);
        });
    });

    describe("update", () => {
        it("should update an existing maintenance", async () => {
            const mockPart = {
                id: "p1",
                name: "Part A",
                installationDate: undefined, // force baseDate to come from equipment
                equipment: {
                    id: "eq1",
                    name: "Equipment A",
                    initialOperationsDate: new Date("2024-01-01"),
                    area: {
                        id: "a1",
                        name: "Area A",
                        plant: {
                            id: "pl1",
                            name: "Plant A",
                        },
                    },
                },
            } as any;

            const mockMaintenance: any = {
                id: "m1",
                title: "Check Pump",
                description: "Routine check",
                recurrence: MaintenanceRecurrenceEnum.MONTHLY,
                dueDate: new Date("2024-02-01"),
                createdAt: new Date(),
                updatedAt: new Date(),
                part: mockPart,
                scheduledDate: undefined,
            };

            const inputData = {
                title: "Updated Check Pump",
                description: "Updated routine check",
                recurrence: MaintenanceRecurrenceEnum.QUARTERLY,
                partId: "p1",
                scheduledDate: undefined,
            };

            const updatedMaintenance = {
                ...mockMaintenance,
                ...inputData,
                dueDate: new Date("2024-04-01"),
            };

            // mock chain
            mockMaintenanceRepo.findOne!.mockResolvedValueOnce(mockMaintenance as any);
            mockPartRepo.findOne!.mockResolvedValueOnce(mockPart as any);
            mockMaintenanceRepo.save!.mockResolvedValueOnce(updatedMaintenance as any);
            mockMaintenanceRepo.findOne!.mockResolvedValueOnce(updatedMaintenance as any);

            const result = await maintenanceService.update("m1", inputData);

            expect(mockMaintenanceRepo.findOne).toHaveBeenCalledWith({
                where: { id: "m1" },
                relations: ["part", "part.equipment", "part.equipment.area", "part.equipment.area.plant"],
            });
            expect(mockPartRepo.findOne).toHaveBeenCalledWith({
                where: { id: "p1" },
                relations: ["equipment"],
            });
            expect(mockMaintenanceRepo.save).toHaveBeenCalledWith(expect.any(Object));
            expect(result).toMatchObject({
                id: "m1",
                title: "Updated Check Pump",
                recurrence: MaintenanceRecurrenceEnum.QUARTERLY,
            });
        });


    });

    describe("delete", () => {
        it("should delete an existing maintenance", async () => {
            const mockMaintenance: any = {
                id: "m1",
                title: "Check Pump",
                recurrence: MaintenanceRecurrenceEnum.MONTHLY,
                dueDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockMaintenanceRepo.findOne!.mockResolvedValue(mockMaintenance as any);
            mockMaintenanceRepo.remove!.mockResolvedValue(mockMaintenance as any);


            const result = await maintenanceService.delete("m1");

            expect(mockMaintenanceRepo.findOne).toHaveBeenCalledWith({
                where: { id: "m1" },
            });

            expect(mockMaintenanceRepo.remove).toHaveBeenCalledWith(mockMaintenance);

            expect(result).toBeUndefined();
        });
    })
})







