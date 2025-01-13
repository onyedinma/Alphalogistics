export type UserRole = 'customer' | 'staff' | 'delivery';

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
} 