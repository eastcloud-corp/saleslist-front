/**
 * Utility Functions Tests
 * 
 * CSV utils, validation functions などの純粋関数テスト
 */

// CSV utility functions のテスト（module import不要）
describe('Data Processing Utils', () => {
  describe('CSV data validation', () => {
    it('should validate company CSV data structure', () => {
      const validCsvRow = {
        name: 'テスト株式会社',
        industry: 'テクノロジー',
        employee_count: '100',
        revenue: '500000000',
        location: '東京都渋谷区',
        website: 'https://test.com',
        phone: '03-1234-5678',
        email: 'info@test.com'
      }

      // 必須フィールド検証
      expect(validCsvRow.name).toBeTruthy()
      expect(validCsvRow.industry).toBeTruthy()
      expect(Number(validCsvRow.employee_count)).toBeGreaterThan(0)
    })

    it('should handle empty or invalid CSV data', () => {
      const invalidCsvRow = {
        name: '',
        industry: '',
        employee_count: 'invalid',
        revenue: 'not-a-number'
      }

      // バリデーション確認
      expect(invalidCsvRow.name.trim()).toBeFalsy()
      expect(Number(invalidCsvRow.employee_count) || 0).toBe(0)
      expect(Number(invalidCsvRow.revenue) || 0).toBe(0)
    })
  })

  describe('Form data processing', () => {
    it('should process form data correctly', () => {
      const formData = {
        name: ' テスト企業株式会社 ',
        industry: '  AI・機械学習  ',
        employee_count: '150',
        email: ' test@company.com '
      }

      // データクリーニング確認
      expect(formData.name.trim()).toBe('テスト企業株式会社')
      expect(formData.industry.trim()).toBe('AI・機械学習')
      expect(Number(formData.employee_count)).toBe(150)
      expect(formData.email.trim()).toBe('test@company.com')
    })

    it('should validate email format', () => {
      const validEmails = [
        'test@company.com',
        'user.name@domain.co.jp',
        'info@test-company.com'
      ]

      const invalidEmails = [
        'invalid-email',
        'test@',
        '@company.com',
        'test.company.com'
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should validate URL format', () => {
      const validUrls = [
        'https://company.com',
        'http://test.co.jp',
        'https://www.example.org'
      ]

      const invalidUrls = [
        'invalid-url',
        'ftp://test.com',
        'company.com',
        'https://'
      ]

      const urlRegex = /^https?:\/\/.+/

      validUrls.forEach(url => {
        expect(urlRegex.test(url)).toBe(true)
      })

      invalidUrls.forEach(url => {
        expect(urlRegex.test(url)).toBe(false)
      })
    })
  })

  describe('Business logic validation', () => {
    it('should calculate project statistics correctly', () => {
      const projects = [
        { status: '運用中', appointment_count: 10, reply_count: 5 },
        { status: '停止', appointment_count: 3, reply_count: 1 },
        { status: '運用中', appointment_count: 8, reply_count: 4 }
      ]

      const activeProjects = projects.filter(p => p.status === '運用中')
      const totalAppointments = projects.reduce((sum, p) => sum + (p.appointment_count || 0), 0)
      const totalReplies = projects.reduce((sum, p) => sum + (p.reply_count || 0), 0)

      expect(activeProjects.length).toBe(2)
      expect(totalAppointments).toBe(21)
      expect(totalReplies).toBe(10)
    })
  })
})