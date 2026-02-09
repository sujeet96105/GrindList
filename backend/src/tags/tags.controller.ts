import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TagDto } from './dto/tag.dto';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Post()
  create(@Body() dto: TagDto) {
    return this.tags.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: TagDto) {
    return this.tags.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tags.softDelete(id);
  }

  @Get()
  list(@Query('updated_after') updatedAfter?: string) {
    return this.tags.listUpdatedSince(updatedAfter);
  }
}
