import { Body, Controller, Get, Post, Route, Security, Tags } from "tsoa";
import { InvalidForeignKeyError } from "../errors/InvalidForeignKeyError";
import { InvalidDataError } from "../errors/InvalidDataError";
import { AuthService } from "../services/AuthService";
import { User } from "../models/User";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
    private authService: AuthService;

    constructor() {
        super();
        this.authService = new AuthService();
    }

    @Security("jwt")
    @Get("/token-validate")
    public async validateToken(): Promise<boolean> {
        return true;
    }


    @Post("/register")
    public async register(@Body() requestBody: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
        try {
            return await this.authService.register(requestBody);
        } catch (error) {
            if (error instanceof InvalidForeignKeyError) {
                this.setStatus(InvalidForeignKeyError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }


    @Post("/login")
    public async login(@Body() requestBody: Omit<User, "id" | "createdAt" | "updatedAt" | "name">): Promise<{
        token: string;
        user: User;
    }> {
        try {
            return await this.authService.login(requestBody);
        } catch (error) {
            if (error instanceof InvalidForeignKeyError) {
                this.setStatus(InvalidForeignKeyError.httpStatusCode);
                throw error;
            }
            if (error instanceof InvalidDataError) {
                this.setStatus(InvalidDataError.httpStatusCode);
                throw error;
            }
            throw error;
        }
    }
} 