export interface User {
  id: number;
  username: string;
  email: string;
  password: string; // Hashed password
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  email: string;
  password?: string; // Optional - only if changing password
  isAdmin: boolean;
}

export interface CheckUsernameRequest {
  username: string;
  excludeUserId?: number; // For edit mode
}

export interface CheckEmailRequest {
  email: string;
  excludeUserId?: number; // For edit mode
}

export interface CheckAvailabilityResponse {
  isAvailable: boolean;
  message?: string;
}

export interface GetUserByIdRequest {
  id: number;
}
