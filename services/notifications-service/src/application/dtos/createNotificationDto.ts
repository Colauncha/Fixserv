export interface CreateNotificationDto {
  userId?: string;
  targetRole?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}
