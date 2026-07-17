import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './core/config/app.config';
import databaseConfig from './core/config/database.config';
import jwtConfig from './core/config/jwt.config';
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { StorageModule } from './core/storage/storage.module';
import { CryptoModule } from './core/crypto/crypto.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NotesModule } from './modules/notes/notes.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { JournalModule } from './modules/journal/journal.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { HabitsModule } from './modules/habits/habits.module';
import { GoalsModule } from './modules/goals/goals.module';
import { FocusModule } from './modules/focus/focus.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { FilesModule } from './modules/files/files.module';
import { VaultModule } from './modules/vault/vault.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),
    DatabaseModule,
    RedisModule,
    StorageModule,
    CryptoModule,
    AuthModule,
    UsersModule,
    NotesModule,
    TasksModule,
    CalendarModule,
    JournalModule,
    ExpensesModule,
    HabitsModule,
    GoalsModule,
    FocusModule,
    BookmarksModule,
    FilesModule,
    VaultModule,
    NotificationsModule,
  ],
  providers: [
    {
      // Global rate limiting on every route unless explicitly overridden with @SkipThrottle()
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
