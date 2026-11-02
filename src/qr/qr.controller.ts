import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { DisplayTokenGuard } from '../auth/guards/display-token.guard';

@ApiTags('QR Display & Visitor Claim')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('current')
  @UseGuards(DisplayTokenGuard)
  @ApiHeader({
    name: 'x-display-token',
    description: 'Staff Display Screen Shared Secret Token',
  })
  @ApiOperation({
    summary:
      'Get or generate the current rotating QR token for authenticated display screens',
  })
  async getCurrentToken() {
    return this.qrService.getCurrentOrNewToken();
  }

  @Post('rotate')
  @UseGuards(DisplayTokenGuard)
  @ApiHeader({
    name: 'x-display-token',
    description: 'Staff Display Screen Shared Secret Token',
  })
  @ApiOperation({ summary: 'Explicitly rotate QR code (~15s cadence)' })
  async rotateToken() {
    return this.qrService.generateRotatingToken();
  }

  @Get('verify/:token')
  @ApiOperation({
    summary:
      'Public endpoint: verify scanned QR token validity before visitor claims',
  })
  @ApiResponse({ status: 200, description: 'Token status and validity' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async verifyToken(@Param('token') token: string) {
    return this.qrService.verifyToken(token);
  }

  @Post('claim/:token')
  @ApiOperation({
    summary:
      'Public endpoint: Visitor taps "Continue to Register" -> atomically consumes token and creates registration session',
  })
  @ApiResponse({
    status: 201,
    description:
      'Token claimed; returns registration session token valid for 5 min',
  })
  @ApiResponse({
    status: 409,
    description: 'Token already claimed by another visitor',
  })
  @ApiResponse({ status: 400, description: 'Token expired' })
  async claimToken(@Param('token') token: string, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return this.qrService.claimToken(token, ipAddress);
  }
}
