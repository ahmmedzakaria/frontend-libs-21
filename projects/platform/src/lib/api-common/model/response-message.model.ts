export interface ResponseMessage {
    type: 'SUCCESS' | 'ERROR' | 'INFO';
    code?: string;
    message: string;
}
