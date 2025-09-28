import apiClient from '@/lib/api'
import axios from 'axios'

const mockAxios = axios as jest.Mocked<typeof axios>
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
} as jest.Mocked<any>

mockAxios.create.mockReturnValue(mockAxiosInstance)

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Authentication', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        tokens: { access: 'access_token', refresh: 'refresh_token' }
      }
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await apiClient.login({ username: 'testuser', password: 'password123' })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'testuser',
        password: 'password123'
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle login failure with invalid credentials', async () => {
      const mockError = {
        response: {
          data: { non_field_errors: ['Invalid credentials'] },
          status: 400
        }
      }
      mockAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(
        apiClient.login({ username: 'wronguser', password: 'wrongpass' })
      ).rejects.toThrow()
    })

    it('should successfully register new user', async () => {
      const mockResponse = {
        user: { id: 1, username: 'newuser', email: 'new@example.com' },
        tokens: { access: 'access_token', refresh: 'refresh_token' }
      }
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await apiClient.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        password2: 'password123'
      })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register/', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        password2: 'password123'
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle registration failure with validation errors', async () => {
      const mockError = {
        response: {
          data: { username: ['This field is required.'] },
          status: 400
        }
      }
      mockAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(
        apiClient.register({
          username: '',
          email: 'test@example.com',
          password: 'pass123',
          password2: 'pass123'
        })
      ).rejects.toThrow()
    })
  })

  describe('Poll Management', () => {
    it('should fetch polls with pagination', async () => {
      const mockResponse = {
        count: 10,
        next: 'http://api/polls/?page=2',
        previous: null,
        results: [
          {
            id: 1,
            question: 'Test Poll?',
            choices: [{ id: 1, choice_text: 'Option 1', votes: 5 }],
            total_votes: 5
          }
        ]
      }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await apiClient.getPolls(1, 'test')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/polls/', {
        params: { page: 1, search: 'test' }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors when fetching polls', async () => {
      const mockError = {
        response: { status: 500, data: { detail: 'Server error' } }
      }
      mockAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(apiClient.getPolls()).rejects.toThrow()
    })

    it('should fetch single poll by ID', async () => {
      const mockPoll = {
        id: 1,
        question: 'Test Poll?',
        description: 'Test description',
        choices: [
          { id: 1, choice_text: 'Option 1', votes: 3 },
          { id: 2, choice_text: 'Option 2', votes: 7 }
        ],
        total_votes: 10,
        user_has_voted: false
      }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockPoll })

      const result = await apiClient.getPoll(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/polls/1/')
      expect(result).toEqual(mockPoll)
    })

    it('should handle 404 error for non-existent poll', async () => {
      const mockError = {
        response: { status: 404, data: { detail: 'Not found.' } }
      }
      mockAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(apiClient.getPoll(999)).rejects.toThrow()
    })

    it('should create new poll successfully', async () => {
      const newPoll = {
        question: 'New Poll Question?',
        description: 'Poll description',
        choices: [
          { choice_text: 'Option 1' },
          { choice_text: 'Option 2' }
        ]
      }
      const mockResponse = {
        id: 1,
        ...newPoll,
        created_at: '2024-01-01T00:00:00Z',
        total_votes: 0
      }
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await apiClient.createPoll(newPoll)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/polls/', newPoll)
      expect(result).toEqual(mockResponse)
    })

    it('should handle poll creation validation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { question: ['This field is required.'] }
        }
      }
      mockAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(
        apiClient.createPoll({
          question: '',
          choices: [{ choice_text: 'Option 1' }]
        })
      ).rejects.toThrow()
    })
  })

  describe('Voting', () => {
    it('should successfully submit vote', async () => {
      const mockResponse = { message: 'Vote recorded successfully' }
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await apiClient.vote(1, 2)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/polls/1/vote/', {
        choice_id: 2
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle duplicate vote attempt', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'You have already voted on this poll.' }
        }
      }
      mockAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(apiClient.vote(1, 2)).rejects.toThrow()
    })

    it('should handle voting without authentication', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Authentication credentials were not provided.' }
        }
      }
      mockAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(apiClient.vote(1, 2)).rejects.toThrow()
    })
  })

  describe('User Profile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        polls_created: 5,
        votes_cast: 10,
        recent_votes: [
          {
            poll_id: 1,
            poll_question: 'Test Poll?',
            choice_text: 'Option 1',
            voted_at: '2024-01-01T00:00:00Z'
          }
        ]
      }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockProfile })

      const result = await apiClient.getUserProfile()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile/')
      expect(result).toEqual(mockProfile)
    })

    it('should handle profile access without authentication', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Authentication credentials were not provided.' }
        }
      }
      mockAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(apiClient.getUserProfile()).rejects.toThrow()
    })
  })

  describe('Token Management', () => {
    it('should store tokens in localStorage on successful auth', () => {
      const tokens = { access: 'access_token', refresh: 'refresh_token' }
      apiClient.setTokens(tokens)

      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'access_token')
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh_token')
    })

    it('should retrieve tokens from localStorage', () => {
      localStorage.getItem = jest.fn()
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')

      const result = apiClient.getTokens()

      expect(result).toEqual({
        access: 'access_token',
        refresh: 'refresh_token'
      })
    })

    it('should clear tokens from localStorage', () => {
      apiClient.clearTokens()

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })

    it('should refresh expired access token', async () => {
      localStorage.getItem = jest.fn().mockReturnValue('refresh_token')
      const mockResponse = { access: 'new_access_token' }
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await apiClient.refreshToken()

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/token/refresh/', {
        refresh: 'refresh_token'
      })
      expect(result).toEqual('new_access_token')
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new_access_token')
    })

    it('should handle token refresh failure', async () => {
      localStorage.getItem = jest.fn().mockReturnValue('invalid_refresh_token')
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Token is invalid or expired' }
        }
      }
      mockAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(apiClient.refreshToken()).rejects.toThrow()
    })
  })
})
