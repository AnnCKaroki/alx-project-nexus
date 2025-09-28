import {
  emailRegex,
  isValidPassword,
  isValidUsername,
  calculatePercentage,
  formatDate,
  formatRelativeTime,
  validatePollData,
  formatApiError,
  createLoadingState
} from '@/lib/utils';

// Form validation tests using real utility functions
describe('Form Validation', () => {
  // Test email validation
  it('should validate email addresses correctly', () => {
    // Valid emails
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('user.name@domain.co.uk')).toBe(true);
    expect(emailRegex.test('valid+email@test.org')).toBe(true);

    // Invalid emails
    expect(emailRegex.test('invalid.email')).toBe(false);
    expect(emailRegex.test('@invalid.com')).toBe(false);
    expect(emailRegex.test('invalid@')).toBe(false);
    expect(emailRegex.test('')).toBe(false);
  });

  // Test password validation
  it('should validate password requirements', () => {
    expect(isValidPassword('password123')).toBe(true);
    expect(isValidPassword('longpassword')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });

  // Test username validation
  it('should validate username requirements', () => {
    expect(isValidUsername('validuser')).toBe(true);
    expect(isValidUsername('user123')).toBe(true);
    expect(isValidUsername('user_name')).toBe(true);
    expect(isValidUsername('ab')).toBe(false); // too short
    expect(isValidUsername('user-name')).toBe(false); // invalid character
    expect(isValidUsername('')).toBe(false); // empty
  });
});

// Test utility functions
describe('Utility Functions', () => {
  it('should format dates correctly', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('January 1, 2024');
    expect(formatDate('2024-12-25T12:30:00Z')).toBe('December 25, 2024');
  });

  it('should calculate vote percentages correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(2, 3)).toBe(67);
    expect(calculatePercentage(0, 0)).toBe(0);
    expect(calculatePercentage(10, 0)).toBe(0);
  });

  it('should format relative time correctly', () => {
    // Test with fixed dates by passing current time as parameter
    const fixedNow = new Date('2024-01-01T12:00:00Z');

    expect(formatRelativeTime('2024-01-01T11:59:30Z', fixedNow)).toBe('Just now');
    expect(formatRelativeTime('2024-01-01T11:58:00Z', fixedNow)).toBe('2 minutes ago');
    expect(formatRelativeTime('2024-01-01T10:00:00Z', fixedNow)).toBe('2 hours ago');
    expect(formatRelativeTime('2023-12-31T12:00:00Z', fixedNow)).toBe('1 days ago');
  });

  it('should validate poll creation data', () => {
    // Valid data
    expect(validatePollData({
      question: 'Test question?',
      choices: [
        { choice_text: 'Option 1' },
        { choice_text: 'Option 2' }
      ]
    })).toEqual([]);

    // Invalid data
    expect(validatePollData({
      question: '',
      choices: [{ choice_text: 'Option 1' }]
    })).toEqual(['Question is required', 'At least 2 choices are required']);

    expect(validatePollData({
      question: 'Q'.repeat(201),
      choices: [
        { choice_text: 'Option 1' },
        { choice_text: 'Option 2' }
      ]
    })).toEqual(['Question is too long']);
  });
});

// Test error handling
describe('Error Handling', () => {
  it('should format API errors consistently', () => {
    // Test different error formats
    expect(formatApiError({
      response: { data: { detail: 'Invalid credentials' } }
    })).toBe('Invalid credentials');

    expect(formatApiError({
      response: { data: { non_field_errors: ['User already exists'] } }
    })).toBe('User already exists');

    expect(formatApiError({
      message: 'Network error'
    })).toBe('Network error');

    expect(formatApiError({})).toBe('An unexpected error occurred');
  });

  it('should handle loading states correctly', () => {
    const loadingState = createLoadingState();

    // Initial state
    const initialState = loadingState.getState();
    expect(initialState.isLoading).toBe(false);
    expect(initialState.error).toBe(null);

    // Start loading
    loadingState.setLoading(true);
    const loadingActiveState = loadingState.getState();
    expect(loadingActiveState.isLoading).toBe(true);
    expect(loadingActiveState.error).toBe(null);

    // Set error
    loadingState.setError('Test error');
    const errorState = loadingState.getState();
    expect(errorState.isLoading).toBe(false);
    expect(errorState.error).toBe('Test error');

    // Start loading again (should clear error)
    loadingState.setLoading(true);
    const reloadingState = loadingState.getState();
    expect(reloadingState.isLoading).toBe(true);
    expect(reloadingState.error).toBe(null);
  });
});
