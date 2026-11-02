import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onApplicationBootstrap() {
    await this.bootstrapInitialAdmin();
  }

  async bootstrapInitialAdmin() {
    const adminEmail =
      this.configService.get<string>('INITIAL_ADMIN_EMAIL') ||
      'admin@mobios.lk';
    const adminPassword =
      this.configService.get<string>('INITIAL_ADMIN_PASSWORD') ||
      'AdminPassword@2026';
    const adminName =
      this.configService.get<string>('INITIAL_ADMIN_NAME') ||
      'MobiOs Infotel Admin';

    const existing = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: 'ADMIN',
          isActive: true,
        },
      });
      this.logger.log(`Initial admin user created: ${adminEmail}`);
    }
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'ADMIN_LOGIN',
      resourceType: 'AUTH',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async createAdminUser(
    dto: CreateAdminDto,
    creatorId?: string,
    creatorEmail?: string,
  ) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      userId: creatorId,
      userEmail: creatorEmail,
      action: 'ADMIN_USER_CREATED',
      resourceType: 'USER',
      resourceId: user.id,
      payload: { email: user.email, name: user.name },
    });

    return user;
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
