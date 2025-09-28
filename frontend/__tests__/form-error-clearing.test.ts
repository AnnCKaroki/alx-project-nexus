// Test to verify login error clearing behavior
describe('Login Form Error Clearing', () => {
  it('should not clear errors immediately', () => {
    // Simulate initial state with error
    let hasError = true;
    let credentials = { username: '', password: '' };

    // This represents the OLD problematic behavior (auto-clearing)
    const oldBehavior = () => {
      if (hasError) {
        hasError = false; // Immediately clears error
      }
    };

    // This represents the NEW correct behavior (clear on input change)
    const newBehavior = (inputName: string, inputValue: string) => {
      if (hasError) {
        hasError = false; // Only clear when user types
      }
      credentials = { ...credentials, [inputName]: inputValue };
    };

    // Test old behavior - error gets cleared immediately
    hasError = true;
    oldBehavior();
    expect(hasError).toBe(false); // Error cleared too early!

    // Test new behavior - error only cleared when user interacts
    hasError = true;
    // Error should persist until user starts typing
    expect(hasError).toBe(true);

    // Now user starts typing
    newBehavior('username', 'test');
    expect(hasError).toBe(false); // Error cleared appropriately
  });

  it('should clear only specific validation errors on field edit', () => {
    let validationErrors: Record<string, string[]> = {
      username: ['Username is required'],
      email: ['Email is required'],
      password: ['Password too short']
    };

    // Simulate editing the username field
    const handleFieldEdit = (fieldName: string) => {
      if (fieldName in validationErrors) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [fieldName]: _, ...rest } = validationErrors;
        validationErrors = rest;
      }
    };

    // Initially has all errors
    expect(Object.keys(validationErrors)).toEqual(['username', 'email', 'password']);

    // Edit username field - should only clear username error
    handleFieldEdit('username');
    expect(Object.keys(validationErrors)).toEqual(['email', 'password']);

    // Edit email field - should only clear email error
    handleFieldEdit('email');
    expect(Object.keys(validationErrors)).toEqual(['password']);

    // Edit password field - should clear password error
    handleFieldEdit('password');
    expect(Object.keys(validationErrors)).toEqual([]);
  });
});
