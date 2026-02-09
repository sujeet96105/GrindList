import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SyncPushDto } from './dto/sync.dto';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('push')
  async push(@Body() dto: SyncPushDto) {
    return this.sync.push(dto.items);
  }

  @Get('pull')
  async pull(@Query('since') since: string) {
    const items = await this.sync.pull(since);
    return { since, items };
  }
}
