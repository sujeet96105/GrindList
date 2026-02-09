import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@Body() dto: TaskDto) {
    return this.tasks.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.tasks.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: TaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tasks.softDelete(id);
  }

  @Get()
  list(@Query('updated_after') updatedAfter?: string) {
    return this.tasks.listUpdatedSince(updatedAfter);
  }
}
