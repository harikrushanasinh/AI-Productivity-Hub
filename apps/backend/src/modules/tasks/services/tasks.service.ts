import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  list(ownerId: string): Promise<Task[]> {
    return this.tasksRepository.findAllByOwner(ownerId);
  }

  async findOne(id: string, ownerId: string): Promise<Task> {
    const task = await this.tasksRepository.findById(id, ownerId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      ownerId,
      createdBy: ownerId,
    });
    return this.tasksRepository.save(task);
  }

  async update(id: string, ownerId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id, ownerId);
    Object.assign(task, dto, {
      dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : task.dueDate,
      updatedBy: ownerId,
    });
    return this.tasksRepository.save(task);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.tasksRepository.softDelete(id);
  }
}
