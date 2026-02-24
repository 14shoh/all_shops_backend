import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('recent-activity')
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('sales-chart')
  getSalesChart(@Query('period') period: 'week' | 'month' | 'year' = 'week') {
    return this.dashboardService.getSalesChart(period);
  }
}
