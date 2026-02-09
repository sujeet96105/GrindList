import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryDto } from './dto/category.dto';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  create(@Body() dto: CategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categories.softDelete(id);
  }

  @Get()
  list(@Query('updated_after') updatedAfter?: string) {
    return this.categories.listUpdatedSince(updatedAfter);
  }
}
