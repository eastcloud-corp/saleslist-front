/**
 * API Client Unit Tests
 * 
 * テスト対象: 修正したAPI Clientが正しく型安全に動作することを確認
 */

import { ApiClient } from '@/lib/api-client'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('ApiClient', () => {
  let apiClient: ApiClient
  
  beforeEach(() => {
    apiClient = new ApiClient()
    mockFetch.mockClear()
  })

  describe('GET requests', () => {
    it('should make GET request with correct URL and headers', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)

      // Act
      await apiClient.get<{results: any[], count: number}>('/test-endpoint')

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should return typed data correctly', async () => {
      // Arrange
      const expectedData = { results: [{ id: 1, name: 'test' }], count: 1 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedData,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)

      // Act
      const result = await apiClient.get<typeof expectedData>('/test-endpoint')

      // Assert
      expect(result).toEqual(expectedData)
    })
  })

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      // Arrange
      const testData = { name: 'test company', industry: 'technology' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...testData }),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response)

      // Act
      await apiClient.post('/companies', testData)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/companies'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData)
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle API errors properly', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Validation error'
      } as Response)

      // Act & Assert
      await expect(apiClient.get('/invalid-endpoint')).rejects.toThrow()
    })
  })
})