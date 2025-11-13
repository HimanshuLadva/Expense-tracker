export interface User {
  id: number;
  username: string;
  email: string;
  password: string; // Hashed password
  createdAt: Date;
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
