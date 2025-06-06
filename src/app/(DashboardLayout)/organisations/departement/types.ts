export interface Responsable {
  id: number;
  username: string;
  email: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  responsable: Responsable | string | null;
  functions?: string[];
  services?: string[];
  created_at?: string;
  updated_at?: string;
  code?: string | null;
  is_active?: boolean;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  responsable_id: number | "";
}

export type NotificationType = {
  type: "success" | "error" | "info";
  message: string;
} | null;
