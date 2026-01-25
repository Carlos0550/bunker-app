import { Prisma } from "@prisma/client";

export interface RegisterData extends Prisma.UserCreateInput {
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
}

export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  businessId: string;
}

export interface CreateUserByAdminData {
  name: string;
  email: string;
  role: number;
  permissions?: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: number;
  permissions?: string[];
  status?: string;
}
