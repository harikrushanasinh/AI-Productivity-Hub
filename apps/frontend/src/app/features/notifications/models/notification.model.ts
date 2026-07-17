export type NotificationType = 'info' | 'reminder' | 'mention' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  sourceModule: string | null;
  isRead: boolean;
  createdAt: string;
}
