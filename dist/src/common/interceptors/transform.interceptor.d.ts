import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ApiResponseEnvelope<T> {
    success: boolean;
    statusCode: number;
    data: T;
    meta?: Record<string, any>;
    timestamp: string;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseEnvelope<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseEnvelope<T>>;
}
