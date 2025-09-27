// Core user data structure matching Django User model
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined: string;
  is_active: boolean;
}

// Login form data structure
export interface LoginCredentials {
  username: string;
  password: string;
}

// Registration form with password confirmation requirement
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

// JWT token pair from Django SimpleJWT
export interface AuthTokens {
  access: string;
  refresh: string;
}

// Complete authentication response with user data and tokens
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Individual poll option with vote tracking
export interface Choice {
  id: number;
  choice_text: string;
  votes: number;
  poll: number;
}

// Complete poll data with creator info and voting status
export interface Poll {
  id: number;
  question: string;
  description?: string;
  created_at: string;
  updated_at: string;
  pub_date: string;
  is_active: boolean;
  created_by: number;
  created_by_username?: string;
  choices: Choice[];
  total_votes: number;
  user_has_voted?: boolean;
  user_choice_id?: number;
}

// Individual user vote record with timestamp
export interface Vote {
  id: number;
  user: number;
  choice: number;
  poll: number;
  voted_at: string;
}

// Django REST Framework pagination wrapper
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Standardized API error structure
export interface APIError {
  message: string;
  field?: string;
  code?: string;
}

// Consistent API response wrapper with success indication
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  errors?: Record<string, string[]>;
}

// Django form validation error structure
export interface ValidationErrors {
  [key: string]: string[];
}

// Poll creation form data structure
export interface CreateChoiceData {
  choice_text: string;
}

// Complete poll creation payload
export interface CreatePollData {
  question: string;
  description?: string;
  choices: CreateChoiceData[];
}

// User voting history item for profile display
export interface UserVoteHistory {
  poll_id: number;
  poll_question: string;
  choice_text: string;
  voted_at: string;
}

// Complete user profile with statistics and recent activity
export interface UserProfile {
  user: User;
  polls_created: number;
  votes_cast: number;
  recent_votes: UserVoteHistory[];
}
