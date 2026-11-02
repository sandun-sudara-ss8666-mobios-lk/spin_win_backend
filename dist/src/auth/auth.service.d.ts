import { OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
export declare class AuthService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, auditService: AuditService);
    onApplicationBootstrap(): Promise<void>;
    bootstrapInitialAdmin(): Promise<void>;
    login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
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
    createAdminUser(dto: CreateAdminDto, creatorId?: string, creatorEmail?: string): Promise<{
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
