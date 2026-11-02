export declare class RegisterVisitorDto {
    sessionToken: string;
    name: string;
    phone: string;
}
export declare class QueryQueueDto {
    status?: string;
    limit?: number;
    offset?: number;
    order?: 'desc' | 'asc';
    search?: string;
}
