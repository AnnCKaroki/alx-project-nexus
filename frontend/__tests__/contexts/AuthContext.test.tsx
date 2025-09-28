import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api')
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

// Test component to access auth context
const TestComponent = () => {
  const { state, login, register, logout } = useAuth()

  return (
    <div>
      <div data-testid="auth-status">
        {state.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {state.user ? state.user.username : 'no-user'}
      </div>
      <div data-testid="loading">{state.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{state.error || 'no-error'}</div>

      <button
        data-testid="login-btn"
        onClick={() => login({ username: 'test', password: 'pass' })}
      >
        Login
      </button>
      <button
        data-testid="register-btn"
        onClick={() => register({
          username: 'test',
          email: 'test@example.com',
          password: 'pass',
          password2: 'pass'
        })}
      >
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockApiClient.getTokens.mockReturnValue({ access: null, refresh: null })
  })

  it('should initialize with unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('should handle successful login', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    const mockTokens = { access: 'access_token', refresh: 'refresh_token' }
    const mockResponse = { user: mockUser, tokens: mockTokens }

    mockApiClient.login.mockResolvedValueOnce(mockResponse)
    mockApiClient.setTokens.mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login-btn'))

    // Should show loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser')
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(mockApiClient.login).toHaveBeenCalledWith({
      username: 'test',
      password: 'pass'
    })
    expect(mockApiClient.setTokens).toHaveBeenCalledWith(mockTokens)
  })

  it('should handle login failure', async () => {
    const mockError = new Error('Invalid credentials')
    mockApiClient.login.mockRejectedValueOnce(mockError)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('error')).toHaveTextContent('Login failed. Please try again.')
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })

  it('should handle successful registration', async () => {
    const mockUser = { id: 1, username: 'newuser', email: 'new@example.com' }
    const mockTokens = { access: 'access_token', refresh: 'refresh_token' }
    const mockResponse = { user: mockUser, tokens: mockTokens }

    mockApiClient.register.mockResolvedValueOnce(mockResponse)
    mockApiClient.setTokens.mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('register-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-info')).toHaveTextContent('newuser')
    })

    expect(mockApiClient.register).toHaveBeenCalledWith({
      username: 'test',
      email: 'test@example.com',
      password: 'pass',
      password2: 'pass'
    })
    expect(mockApiClient.setTokens).toHaveBeenCalledWith(mockTokens)
  })

  it('should handle registration failure', async () => {
    const mockError = new Error('Username already exists')
    mockApiClient.register.mockRejectedValueOnce(mockError)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('register-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('error')).toHaveTextContent('Registration failed. Please try again.')
    })
  })

  it('should handle logout', async () => {
    // Start with authenticated state
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    const mockTokens = { access: 'access_token', refresh: 'refresh_token' }
    const mockResponse = { user: mockUser, tokens: mockTokens }

    mockApiClient.login.mockResolvedValueOnce(mockResponse)
    mockApiClient.setTokens.mockImplementation(() => {})
    mockApiClient.clearTokens.mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Login first
    fireEvent.click(screen.getByTestId('login-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    // Then logout
    fireEvent.click(screen.getByTestId('logout-btn'))

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user')
    expect(mockApiClient.clearTokens).toHaveBeenCalled()
  })

  it('should restore authentication state from localStorage on mount', () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    const mockTokens = { access: 'access_token', refresh: 'refresh_token' }

    mockApiClient.getTokens.mockReturnValue(mockTokens)
    localStorage.setItem('user', JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('testuser')
  })

  it('should clear error state on successful auth action', async () => {
    // First, create an error state
    const mockError = new Error('Login failed')
    mockApiClient.login.mockRejectedValueOnce(mockError)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Login failed. Please try again.')
    })

    // Now successful login should clear the error
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    const mockTokens = { access: 'access_token', refresh: 'refresh_token' }
    const mockResponse = { user: mockUser, tokens: mockTokens }

    mockApiClient.login.mockResolvedValueOnce(mockResponse)
    mockApiClient.setTokens.mockImplementation(() => {})

    fireEvent.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })
  })
})
