import * as jwt from "jsonwebtoken";

export const encrypt = (payload: Record<string, unknown>): Promise<string> => {
    const secret = process.env.JWT_SECRET || "default_secret_key";
    const expiresIn = process.env.JWT_EXPIRES_IN || "86400";

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            secret,
            { expiresIn: expiresIn ? parseInt(expiresIn, 10) : 86400 },
            (err, token) => {
                if (err || !token) return reject(err);
                resolve(token);
            }
        );
    });
}