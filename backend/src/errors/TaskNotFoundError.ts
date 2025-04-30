export class TaskNotFoundError extends Error {
  static readonly httpStatusCode = 404;
  constructor(message: string = "Task not found") {
    super(message);
    this.name = 'TaskNotFoundError';
    Object.setPrototypeOf(this, TaskNotFoundError.prototype);
  }
}