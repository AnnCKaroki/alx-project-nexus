/**
 * Utility functions for the voting app
 */

// Email validation regex
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Username validation
export const isValidUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
};

// Calculate vote percentage
export const calculatePercentage = (votes: number, total: number): number => {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
};

// Format date for display with timezone stability
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Force UTC to ensure consistent results across timezones
  });
};

// Format date with time for polls page
export const formatDateWithTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
};

// Format relative time
export const formatRelativeTime = (dateString: string, currentTime?: Date): string => {
  const now = currentTime || new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(dateString);
};

// Poll data validation
export interface PollData {
  question: string;
  choices: { choice_text: string }[];
}

export const validatePollData = (data: PollData): string[] => {
  const errors: string[] = [];

  if (!data.question.trim()) {
    errors.push('Question is required');
  }

  if (data.question.length > 200) {
    errors.push('Question is too long');
  }

  const validChoices = data.choices.filter(c => c.choice_text.trim());
  if (validChoices.length < 2) {
    errors.push('At least 2 choices are required');
  }

  return errors;
};

// API error formatting
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
      non_field_errors?: string[];
    };
  };
  message?: string;
}

export const formatApiError = (error: ApiError): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.non_field_errors?.[0]) {
    return error.response.data.non_field_errors[0];
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Loading state management helpers
export const createLoadingState = () => {
  let isLoading = false;
  let error: string | null = null;

  const setLoading = (loading: boolean) => {
    isLoading = loading;
    if (loading) error = null; // Clear error when starting new operation
  };

  const setError = (err: string) => {
    error = err;
    isLoading = false; // Stop loading on error
  };

  const getState = () => ({ isLoading, error });

  return { setLoading, setError, getState };
};
