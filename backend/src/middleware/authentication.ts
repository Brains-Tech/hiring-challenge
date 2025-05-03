import * as express from "express";
import { encrypt } from "../utils/encrypt";

export type ExpressRequestWithUser = express.Request & {
    user?: { id: string };
};

export async function expressAuthentication(
    request: ExpressRequestWithUser,
    securityName: string,
    _scopes?: string[]
): Promise<any> {
    if (securityName === "jwt") {
        const token = request.headers["authorization"]?.split(" ")[1];

        if (!token) {
            return Promise.reject(new Error("No token provided"));
        }

        return encrypt({ id: request.user?.id })
    }

    return Promise.reject(new Error("Invalid security name"));
}