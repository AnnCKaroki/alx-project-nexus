import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Navbar from '@/components/ui/Navbar'
import { useAuth } from '@/contexts/AuthContext'

// Mock the auth context
jest.mock('@/contexts/AuthContext')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'Link'
  return MockLink
})

describe('Navbar Component', () => {
  const mockLogout = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render navigation links for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, user: null, isLoading: false, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    expect(screen.getByText('VoteApp')).toBeDefined()
    expect(screen.getByText('Polls')).toBeDefined()
    expect(screen.getByText('Login')).toBeDefined()
    expect(screen.getByText('Sign Up')).toBeDefined()

    // Should not show authenticated user elements
    expect(screen.queryByText('Profile')).toBeNull()
    expect(screen.queryByText('Create Poll')).toBeNull()
    expect(screen.queryByText('Logout')).toBeNull()
  })

  it('should render navigation links for authenticated users', () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', date_joined: '2024-01-01', is_active: true }
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: true, user: mockUser, isLoading: false, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    expect(screen.getByText('VoteApp')).toBeDefined()
    expect(screen.getByText('Polls')).toBeDefined()
    expect(screen.getByText('Profile')).toBeDefined()
    expect(screen.getByText('Create Poll')).toBeDefined()
    expect(screen.getByText('Logout')).toBeDefined()

    // Should not show unauthenticated user elements
    expect(screen.queryByText('Login')).toBeNull()
    expect(screen.queryByText('Sign Up')).toBeNull()
  })

  it('should handle logout button click', () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', date_joined: '2024-01-01', is_active: true }
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: true, user: mockUser, isLoading: false, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('should toggle mobile menu', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, user: null, isLoading: false, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    // Find mobile menu button by aria-label
    const menuButton = screen.getByLabelText('Open main menu')
    expect(menuButton).toBeDefined()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    // Click to open menu
    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    // Click again to close menu
    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('should have proper accessibility attributes', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, user: null, isLoading: false, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    const menuButton = screen.getByLabelText('Open main menu')
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    const mobileMenu = screen.getByLabelText('Mobile menu')
    expect(mobileMenu).toHaveAttribute('id', 'mobile-menu')
  })

  it('should show correct navigation structure', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, user: null, isLoading: false, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    // Check that the navbar has proper semantic structure
    const nav = screen.getByRole('navigation')
    expect(nav).toBeDefined()
    expect(nav).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200')
  })

  it('should render loading state gracefully', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, user: null, isLoading: true, error: null },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    // Should still render the navbar even during loading
    expect(screen.getByText('VoteApp')).toBeDefined()
    expect(screen.getByText('Polls')).toBeDefined()
  })

  it('should handle error state gracefully', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, user: null, isLoading: false, error: 'Auth error' },
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    })

    render(<Navbar />)

    // Should still render the navbar even with auth errors
    expect(screen.getByText('VoteApp')).toBeDefined()
    expect(screen.getByText('Polls')).toBeDefined()
    expect(screen.getByText('Login')).toBeDefined()
  })
})
