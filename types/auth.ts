export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'staff' | 'delivery';
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'customer' | 'admin' | 'staff' | 'delivery';
