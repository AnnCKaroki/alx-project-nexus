import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock localStorage
const storage = new Map()

// Create proper Jest mocks that maintain both functionality and spy capabilities
const getItemMock = jest.fn((key) => (storage.has(key) ? storage.get(key) : null))
const setItemMock = jest.fn((key, value) => {
  storage.set(key, String(value))
})
const removeItemMock = jest.fn((key) => {
  storage.delete(key)
})
const clearMock = jest.fn(() => {
  storage.clear()
})
const keyMock = jest.fn((index) => {
  const keys = Array.from(storage.keys())
  return keys[index] || null
})

const localStorageMock = {
  getItem: getItemMock,
  setItem: setItemMock,
  removeItem: removeItemMock,
  clear: clearMock,
  // Add length property and key method for full localStorage API compatibility
  get length() {
    return storage.size;
  },
  key: keyMock,
}
global.localStorage = localStorageMock

// Add a helper to reset localStorage mock calls between tests
global.resetLocalStorageMock = () => {
  getItemMock.mockClear()
  setItemMock.mockClear()
  removeItemMock.mockClear()
  clearMock.mockClear()
  keyMock.mockClear()
}

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}))

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
}
