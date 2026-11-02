import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DisplayTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tokenHeader = request.headers['x-display-token'] as string;
    const tokenQuery = request.query?.display_token as string;
    const expectedSecret =
      this.configService.get<string>('DISPLAY_SHARED_SECRET') ||
      'mobios-display-secret';

    const token = tokenHeader || tokenQuery;

    // Check if valid display token
    if (token && token === expectedSecret) {
      request.isDisplayClient = true;
      return true;
    }

    // Also check if admin user is already authenticated via Bearer token
    if (request.user) {
      return true;
    }

    throw new UnauthorizedException(
      'Valid display token or staff authentication required',
    );
  }
}
