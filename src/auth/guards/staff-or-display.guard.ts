import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class StaffOrDisplayGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tokenHeader = request.headers['x-display-token'] as string;
    const tokenQuery = request.query?.display_token as string;
    const expectedSecret =
      this.configService.get<string>('DISPLAY_SHARED_SECRET') ||
      'mobios-display-screen-auth-token-key-2026';

    const displayToken = tokenHeader || tokenQuery;

    // 1. Check Display Screen Shared Secret
    if (displayToken && displayToken === expectedSecret) {
      request.isDisplayClient = true;
      return true;
    }

    // 2. Check Staff JWT Bearer Token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7);
      try {
        const secret =
          this.configService.get<string>('JWT_SECRET') ||
          'mobios-jwt-secret-key-2026';
        const payload = this.jwtService.verify(jwtToken, { secret });
        request.user = payload;
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired authentication token');
      }
    }

    throw new UnauthorizedException(
      'Valid display token or staff authentication required',
    );
  }
}
