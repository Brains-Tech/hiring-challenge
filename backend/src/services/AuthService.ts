import { DatabaseContext } from "../config/database-context";
import { InvalidDataError } from "../errors/InvalidDataError";
import { User } from "../models/User";
import { QueryFailedError, Repository } from "typeorm";
import { hash, compare, } from "bcrypt";
import { encrypt } from "../utils/encrypt";




export class AuthService {
    private userRepository: Repository<User>;
    private readonly HASH_SALT_LENGTH = 10;

    constructor() {
        this.userRepository = DatabaseContext.getInstance().getRepository(User);
    }

    async register(data: Pick<User, "name" | "email" | "password">): Promise<User> {
        try {
            const userExists = await this.userRepository.findOne({
                where: {
                    email: data.email,
                },
            });
            if (userExists) {
                throw new InvalidDataError('Email já cadastrado');
            }

            if (!this.isPasswordLengthValid(data.password)) {
                throw new InvalidDataError('Senha deve ter no mínimo 6 caracteres');
            }

            const hashedPassword = await this.hashPassword(data.password);

            const user = this.userRepository.create({
                name: data.name,
                email: data.email,
                password: hashedPassword,
            });

            await this.userRepository.save(user);

            return user;

        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new InvalidDataError("Invalid area data");
            }
            throw error;
        }
    }


    async login(data: Pick<User, "email" | "password">): Promise<{
        token: string;
        user: User;
    }> {
        const findUser = await this.userRepository.findOne({
            where: {
                email: data.email,
            },
        });

        if (!findUser) {
            throw new InvalidDataError("User not found with this email");
        }

        const isPasswordValid = await this.comparePassword(data.password, findUser.password);

        if (!isPasswordValid) {
            throw new InvalidDataError("Email ou senha inválidos");
        }

        const token = await encrypt({ id: findUser.id, email: findUser.email, name: findUser.name });
        return {
            token,
            user: findUser
        };
    }
    private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return compare(password, hashedPassword);
    }

    private isPasswordLengthValid(password: string): boolean {
        return password.length >= 6;
    }

    private async hashPassword(password: string): Promise<string> {
        return hash(password, this.HASH_SALT_LENGTH);
    }


} 