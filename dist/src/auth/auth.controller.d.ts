import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: any): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN";
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: "ADMIN";
        isActive: boolean;
        createdAt: Date;
    }>;
    createUser(dto: CreateAdminDto, creatorId: string, creatorEmail: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: "ADMIN";
        isActive: boolean;
        createdAt: Date;
    }>;
    listUsers(): Promise<{
        id: string;
        email: string;
        name: string;
        role: "ADMIN";
        isActive: boolean;
        createdAt: Date;
    }[]>;
}
