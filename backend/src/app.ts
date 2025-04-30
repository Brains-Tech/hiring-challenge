import express, { Request, Response, NextFunction } from 'express';
import { RegisterRoutes } from './routes/routes';
import cors from 'cors';
import { ValidateError } from '@tsoa/runtime';

const app = express();

// Use JSON parser for all routes
app.use(express.json());
app.use(cors());

// Custom error handler that will be used later
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Get request details for better logging
  const { method, url, body, params, query } = req;
  
  console.error(`
    Error handling ${method} ${url}
    Parameters: ${JSON.stringify(params)}
    Query: ${JSON.stringify(query)}
    Body: ${JSON.stringify(body)}
    Error: ${err.name}: ${err.message || 'Unknown error'}
    Stack: ${err.stack || 'No stack trace'}
  `);
  
  // Handle Tsoa validation errors
  if (err instanceof ValidateError) {
    console.log('Validation Error Details:', JSON.stringify(err?.fields));
    return res.status(400).json({
      name: 'ValidationError',
      message: 'Request validation failed',
      status: 400,
      details: err?.fields || 'Invalid request parameters'
    });
  }

  // Handle known HTTP errors (custom errors with status code)
  if (err.status) {
    return res.status(err.status).json({
      name: err.name || 'APIError',
      message: err.message || 'An error occurred',
      status: err.status,
      details: err.details || undefined
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    name: 'InternalServerError',
    message: 'An unexpected error occurred',
    status: 500,
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
};

// Register routes AFTER defining the error handler
RegisterRoutes(app);

// Add a 404 handler for routes that don't exist
app.use((_req: Request, res: Response) => {
  return res.status(404).json({
    name: 'NotFoundError',
    message: 'The requested endpoint does not exist',
    status: 404
  });
});

// Add the error handler AFTER registering routes
app.use(errorHandler);

export { app };