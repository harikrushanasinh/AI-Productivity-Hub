import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  findAllByOwner(ownerId: string): Promise<Task[]> {
    return this.repo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  findById(id: string, ownerId: string): Promise<Task | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<Task>): Task {
    return this.repo.create(data);
  }

  save(task: Task): Promise<Task> {
    return this.repo.save(task);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
