 
export const APP_NAME = 'Bunker App';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const USER_ROLES = {
  ADMIN: 1,
  USER: 2,
} as const;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const;


