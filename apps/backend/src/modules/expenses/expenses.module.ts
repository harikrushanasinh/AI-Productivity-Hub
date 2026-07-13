import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { ExpensesController } from './controllers/expenses.controller';
import { ExpensesService } from './services/expenses.service';
import { ExpensesRepository } from './repositories/expenses.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
  exports: [ExpensesService],
})
export class ExpensesModule {}
