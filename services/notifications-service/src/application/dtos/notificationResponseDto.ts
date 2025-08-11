export interface NotificationResponseDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  status: string;
  createdAt: string;
  readAt?: string;
}
