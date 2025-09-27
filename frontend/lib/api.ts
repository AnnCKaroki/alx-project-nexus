import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  AuthResponse,
  Poll,
  PaginatedResponse,
  CreatePollData,
  Vote,
  UserProfile
} from '@/types';

// Centralized HTTP client with automatic JWT token management
class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Automatically inject JWT token into all authenticated requests
    this.client.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401s with automatic token refresh to maintain user sessions
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosError['config'] & { _retry?: boolean };

        // Attempt token refresh on authentication failures
        if (error.response?.status === 401 && !originalRequest?._retry) {
          if (originalRequest) {
            originalRequest._retry = true;
          }

          try {
            await this.refreshToken();
            const token = this.getAccessToken();
            if (token && originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return originalRequest ? this.client(originalRequest) : Promise.reject(error);
          } catch (refreshError) {
            // Force re-authentication when token refresh fails
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Browser-safe token storage with SSR compatibility
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Complete authentication flow with automatic token persistence
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login/', credentials);
    this.setTokens(response.data.tokens);
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/register/', userData);
    this.setTokens(response.data.tokens);
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.client.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // Ensure local cleanup even if server communication fails
        console.warn('Server logout failed:', error);
      }
    }
    this.clearTokens();
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: AxiosResponse<AuthTokens> = await this.client.post('/auth/refresh/', {
      refresh: refreshToken,
    });

    this.setTokens(response.data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/auth/user/');
    return response.data;
  }

  // Paginated polling data with optional search filtering
  async getPolls(page = 1, search?: string): Promise<PaginatedResponse<Poll>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (search) {
      params.append('search', search);
    }

    const response: AxiosResponse<PaginatedResponse<Poll>> = await this.client.get(
      `/polls/?${params.toString()}`
    );
    return response.data;
  }

  async getPoll(id: number): Promise<Poll> {
    const response: AxiosResponse<Poll> = await this.client.get(`/polls/${id}/`);
    return response.data;
  }

  async createPoll(pollData: CreatePollData): Promise<Poll> {
    const response: AxiosResponse<Poll> = await this.client.post('/polls/', pollData);
    return response.data;
  }

  async deletePoll(id: number): Promise<void> {
    await this.client.delete(`/polls/${id}/`);
  }

  // Record user vote with immediate result reflection
  async vote(pollId: number, choiceId: number): Promise<Vote> {
    const response: AxiosResponse<Vote> = await this.client.post('/votes/', {
      poll: pollId,
      choice: choiceId,
    });
    return response.data;
  }

  async getUserVotes(): Promise<Vote[]> {
    const response: AxiosResponse<Vote[]> = await this.client.get('/votes/my-votes/');
    return response.data;
  }

  async getUserProfile(): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> = await this.client.get('/auth/profile/');
    return response.data;
  }

  // Quick authentication status check without API call
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Flexible endpoint access for future API expansions
  async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.client.request({
      method,
      url,
      data,
    });
    return response.data;
  }
}

// Singleton ensures consistent authentication state across app
const apiClient = new APIClient();

export default apiClient;
