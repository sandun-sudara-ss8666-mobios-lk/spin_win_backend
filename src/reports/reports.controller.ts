import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard, Reports & Auditing')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Real-time dashboard KPIs, active day state, and prize breakdown',
  })
  async getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Detailed exhibition summary report by day' })
  async getSummary(@Query('dayId') dayId?: string) {
    return this.reportsService.getSummaryReport(dayId);
  }

  @Get('audit-logs')
  @ApiOperation({
    summary: 'Query recent audit log trail with optional action filter',
  })
  async getAuditLogs(
    @Query('limit') limit?: number,
    @Query('action') action?: string,
  ) {
    return this.auditService.findRecent(limit ? Number(limit) : 50, action);
  }
}
