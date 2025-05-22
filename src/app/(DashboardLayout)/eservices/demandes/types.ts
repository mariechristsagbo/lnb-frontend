// Types pour les notifications
export interface NotificationType {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface NotificationPreference {
  id: number;
  user: number;
  notification_type: number;
  notification_type_name: string;
  notification_type_code: string;
  notification_type_icon: string;
  channel: number;
  channel_name: string;
  channel_type: string;
  channel_type_display: string;
  is_enabled: boolean;
}

export interface ServiceRequest {
  id?: number;
  workflow: number;
  requester: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  current_task: number;
  reference_number?: string;
}

export interface FormData {
  workflow: number;
  requester: number;
  description: string;
  status: 'draft' | 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  current_task: number;
  requestType: 'leave' | 'document' | 'support' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  urgency?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  files: File[];
  requestId?: string;
}

export interface RequestOption {
  value: string;
  label: string;
}