import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReminderDto } from './dto/reminder.dto';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post()
  create(@Body() dto: ReminderDto) {
    return this.reminders.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ReminderDto) {
    return this.reminders.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.reminders.softDelete(id);
  }

  @Get()
  list(@Query('updated_after') updatedAfter?: string) {
    return this.reminders.listUpdatedSince(updatedAfter);
  }
}
