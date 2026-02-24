import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      icon: dto.icon ?? null,
      color: dto.color ?? '#6366f1',
      parentId: dto.parentId ?? null,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { deletedAt: undefined as any },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: undefined as any },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name != null) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.color != null) category.color = dto.color;
    if (dto.parentId !== undefined) category.parentId = dto.parentId;
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.softRemove(category);
  }
}
