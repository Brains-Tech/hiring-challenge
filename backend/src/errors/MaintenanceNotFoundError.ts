import { HttpError } from "./HttpError";

export class MaintenanceNotFoundError extends HttpError {
    static readonly httpStatusCode = 404;

    constructor(message: string = "Area not found") {
        super(message, MaintenanceNotFoundError.httpStatusCode);
        this.name = 'MaintenanceNotFoundError';
        Object.setPrototypeOf(this, MaintenanceNotFoundError.prototype);
    }
} 