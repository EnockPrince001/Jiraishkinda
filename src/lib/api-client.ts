const IDENTITY_API_URL = 'https://localhost:7275';
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  username: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${IDENTITY_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid email or password');
    }

    return response.json();
  },

  async register(data: RegisterRequest): Promise<void> {
    const response = await fetch(`${IDENTITY_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || 'Registration failed');
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${IDENTITY_API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to process request' }));
      throw new Error(error.message || 'Failed to send password reset email');
    }

    return response.json();
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${IDENTITY_API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Password reset failed' }));
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
  },
};