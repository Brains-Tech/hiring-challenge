import { AuthService } from "../../src/services/AuthService";
import { DatabaseContext } from "../../src/config/database-context";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as bcrypt from "bcrypt";
import { InvalidDataError } from "../../src/errors/InvalidDataError";

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock("../../src/config/database-context");

describe("AuthService", () => {
    let authService: AuthService;
    let mockRepository: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };

    beforeEach(() => {
        mockRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };


        (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
            getRepository: () => mockRepository,
        });

        authService = new AuthService();
    });

    const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "secure123",
    };

    describe("register", () => {
        it("should register a user successfully", async () => {
            (mockRepository.findOne as any).mockResolvedValue(null);
            (bcrypt.hash as any).mockResolvedValue("hashed_secure123");

            const savedUser = {
                id: "1",
                ...userData,
                password: "hashed_secure123",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockRepository.create as jest.Mock).mockReturnValue(savedUser);
            (mockRepository.save as any).mockResolvedValue(savedUser);

            const result = await authService.register(userData);

            expect(result).toEqual(savedUser);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
            expect(mockRepository.create).toHaveBeenCalledWith({
                name: userData.name,
                email: userData.email,
                password: "hashed_secure123",
            });
            expect(mockRepository.save).toHaveBeenCalledWith(savedUser);
        });


        it("should throw an error if the email is already registered", async () => {
            (mockRepository.findOne as any).mockResolvedValue(userData);

            await expect(authService.register(userData)).rejects.toThrow(
                InvalidDataError
            );
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: userData.email },
            });


        });



        it("should throw an error if the password is too short", async () => {
            const shortPasswordData = { ...userData, password: "short" };
            (mockRepository.findOne as any).mockResolvedValue(null);

            await expect(authService.register(shortPasswordData)).rejects.toThrow(
                InvalidDataError
            );
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: shortPasswordData.email },
            });
        });


        it("should throw an error if hashing the password fails", async () => {
            (mockRepository.findOne as any).mockResolvedValue(null);
            (bcrypt.hash as any).mockRejectedValue(new Error("Hashing error"));

            await expect(authService.register(userData)).rejects.toThrow(
                Error
            );
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
        });
    });



    describe("login", () => {
        it("should log in a user successfully", async () => {
            (mockRepository.findOne as any).mockResolvedValue(userData);
            (bcrypt.compare as any).mockResolvedValue(true);

            const result = await authService.login({
                email: userData.email,
                password: userData.password,
            });

            expect(result).toEqual({
                token: expect.any(String),
                user: userData,
            });
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(
                userData.password,
                userData.password
            );
        });

        it("should throw an error if the email is not registered", async () => {
            (mockRepository.findOne as any).mockResolvedValue(null);

            await expect(
                authService.login({
                    email: userData.email,
                    password: userData.password,
                })
            ).rejects.toThrow(InvalidDataError);
        });

        it("should throw an error if the password is incorrect", async () => {
            (mockRepository.findOne as any).mockResolvedValue(userData);
            (bcrypt.compare as any).mockResolvedValue(false);

            await expect(
                authService.login({
                    email: userData.email,
                    password: "wrongpassword",
                })
            ).rejects.toThrow(InvalidDataError);
        });
    });

    it("should throw an error if comparing the password fails", async () => {
        (mockRepository.findOne as any).mockResolvedValue(userData);
        (bcrypt.compare as any).mockRejectedValue(new Error("Comparison error"));

        await expect(
            authService.login({
                email: userData.email,
                password: userData.password,
            })
        ).rejects.toThrow(Error);
    });
});