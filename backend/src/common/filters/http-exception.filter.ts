import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    // Get the response object from the exception, which might be a string or an object
    const exceptionResponse = exception.getResponse();
    
    // Determine the message:
    let message: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
        // This handles validation pipes or other complex error objects
        // If 'message' is an array (e.g., from class-validator), join them.
        if (Array.isArray(exceptionResponse.message)) {
            message = exceptionResponse.message.join(', ');
        } else {
            message = exceptionResponse.message as string; 
        }
    } else if (typeof exceptionResponse === 'string') {
        // This handles simple string messages (e.g., from new HttpException('Error message', ...))
        message = exceptionResponse;
    } else {
        // Fallback to the standard HTTP status message
        message = exception.message || 'Internal server error';
    }

    // You can also add logging here if needed
    // console.error(`Error: ${message} - Path: ${request.url}`);

    response
      .status(status)
      .json({
        success: false,
        message: message,
      });
  }
}