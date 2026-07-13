import { ResponseMessage } from './response-message.model';

export interface ApiResponse<T> {
    status: string;             // "SUCCESS", "ERROR", "INFO"
    statusCode: number;         // 200, 400, 500
    message: ResponseMessage[]; // array of messages
    data: T;                    // generic response payload
}