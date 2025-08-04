import { notifications } from '../../database/schema/index';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type Notification = InferSelectModel<typeof notifications>;
export type CreateNotification = InferInsertModel<typeof notifications>;

export interface NotificationWithRelations extends Notification {
  // Add any joined data here if needed
}