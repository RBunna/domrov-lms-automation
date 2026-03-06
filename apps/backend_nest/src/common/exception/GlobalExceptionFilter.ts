import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    @SentryExceptionCaptured()
    catch(exception: unknown, host): void {
        // Optionally handle response
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
}   