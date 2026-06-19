export interface User{
    
  id: number;
  username: string | null;
  email: string;
  password: string;
  role: string | null;
  deluxeToken: string | null;
  lastLoginIp: string | null;
  profileImage: string | null;
  totpSecret: string | null;
  isActive: number; // SQLite stores TINYINT as number
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

}