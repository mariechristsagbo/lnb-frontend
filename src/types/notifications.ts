export interface NotificationType {
  id: string;
  recipient: number;
  sender: number;
  sender_details: {
    id: number;
    username: string;
    full_name: string;
    email: string;
  };
  notification_type: number;
  notification_type_name: string;
  notification_type_code: string;
  notification_type_icon: string;
  notification_type_color: string;
  title: string;
  message: string;
  action_url: string;
  is_read: boolean;
  is_archived: boolean;
  is_system: boolean;
  created_at: string;
  time_since: string;
  channel_name: string;
}