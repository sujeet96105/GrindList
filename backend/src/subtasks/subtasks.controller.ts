import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SubtaskDto } from './dto/subtask.dto';
import { SubtasksService } from './subtasks.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class SubtasksController {
  constructor(private readonly subtasks: SubtasksService) {}

  @Post('tasks/:taskId/subtasks')
  create(@Param('taskId') taskId: string, @Body() dto: SubtaskDto) {
    return this.subtasks.create({ ...dto, taskId });
  }

  @Patch('subtasks/:id')
  update(@Param('id') id: string, @Body() dto: SubtaskDto) {
    return this.subtasks.update(id, dto);
  }

  @Delete('subtasks/:id')
  delete(@Param('id') id: string) {
    return this.subtasks.softDelete(id);
  }

  @Get('tasks/:taskId/subtasks')
  list(@Param('taskId') taskId: string, @Query('updated_after') updatedAfter?: string) {
    return this.subtasks.listByTask(taskId, updatedAfter);
  }
}
