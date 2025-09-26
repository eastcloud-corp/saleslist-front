import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { CSVImportDialog } from '@/components/companies/csv-import-dialog'

jest.mock('@/components/companies/csv-template-download', () => ({
  CSVTemplateDownload: () => <div data-testid="csv-template" />,
}))

const parseCSVMock = jest.fn()
const validateCSVDataMock = jest.fn()
const convertCSVToCompanyDataMock = jest.fn()

jest.mock('@/lib/csv-utils', () => ({
  parseCSV: (...args: unknown[]) => parseCSVMock(...args),
  validateCSVData: (...args: unknown[]) => validateCSVDataMock(...args),
  convertCSVToCompanyData: (...args: unknown[]) => convertCSVToCompanyDataMock(...args),
}))

describe('CSVImportDialog', () => {
  const onImport = jest.fn().mockResolvedValue({ successCount: 1, errorItems: [], missingCorporateNumberCount: 0 })

  beforeEach(() => {
    parseCSVMock.mockReset()
    validateCSVDataMock.mockReset()
    convertCSVToCompanyDataMock.mockReset()
    onImport.mockClear()
    onImport.mockResolvedValue({ successCount: 1, errorItems: [], missingCorporateNumberCount: 0 })
    jest.useRealTimers()
  })

  const createCSVFile = (content: string) => {
    const file = new File([content], 'companies.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: jest.fn(() => Promise.resolve(content)),
    })
    return file
  }

  it('shows validation errors when CSV has issues', async () => {
    const mockErrors = [
      {
        row: 2,
        field: 'name',
        value: '',
        message: '「企業名」列: 必須項目です',
      },
    ]
    parseCSVMock.mockReturnValue([{ name: '' }])
    validateCSVDataMock.mockReturnValue(mockErrors)

    render(<CSVImportDialog open onOpenChange={() => {}} onImport={onImport} />)

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })
    expect(fileInput).toBeInstanceOf(HTMLInputElement)

    const file = createCSVFile('Company Name\n')
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText(/エラーを検出しました/)).toBeInTheDocument()
      expect(parseCSVMock).toHaveBeenCalled()
      expect(validateCSVDataMock).toHaveBeenCalled()
    })

    expect(screen.queryByText(/インポート開始/)).not.toBeInTheDocument()
  })

  it('imports data successfully after validation', async () => {
    parseCSVMock.mockReturnValue([{ name: 'Example' }])
    validateCSVDataMock.mockReturnValue([])
    convertCSVToCompanyDataMock.mockReturnValue([{ name: 'Example', industry: 'IT' }])

    const handleOpenChange = jest.fn()
    render(<CSVImportDialog open onOpenChange={handleOpenChange} onImport={onImport} />)

    const realSetTimeout = global.setTimeout
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (typeof delay === 'number' && delay === 100) {
          if (typeof callback === 'function') {
            callback(...args)
          }
          return 0 as unknown as NodeJS.Timeout
        }
        return realSetTimeout(callback, delay as number, ...args)
      })

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })
    const file = createCSVFile('Company Name,Industry\nExample,IT')

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('インポート開始（1件）')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('インポート開始（1件）'))
    })

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith([{ name: 'Example', industry: 'IT' }], expect.any(Function))
      expect(screen.getByText('インポートが完了しました')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('閉じる'))
    })

    expect(handleOpenChange).toHaveBeenCalledWith(false)
    setTimeoutSpy.mockRestore()
  })

  it('displays categorized summary when import reports duplicates and validation errors', async () => {
    parseCSVMock.mockReturnValue([{ name: 'Example' }])
    validateCSVDataMock.mockReturnValue([])
    convertCSVToCompanyDataMock.mockReturnValue([{ name: 'Example', corporate_number: '1234567890123' }])

    onImport.mockImplementationOnce(async (_companies, onProgress) => {
      onProgress(100)
      return {
        successCount: 0,
        missingCorporateNumberCount: 1,
        errorItems: [
          { name: 'Row1', message: 'duplicate error', category: 'duplicate' },
          { name: 'Row2', message: 'validation error', category: 'validation' },
          { name: 'Row3', message: 'api error', category: 'api' },
        ],
      }
    })

    const realSetTimeout = global.setTimeout
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (typeof delay === 'number' && delay === 100) {
          if (typeof callback === 'function') {
            callback(...args)
          }
          return 0 as unknown as NodeJS.Timeout
        }
        return realSetTimeout(callback, delay as number, ...args)
      })

    render(<CSVImportDialog open onOpenChange={() => {}} onImport={onImport} />)

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })

    const file = createCSVFile('Company Name,Corporate Number\nExample,1234567890123')

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('インポート開始（1件）')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('インポート開始（1件）'))
    })

    await waitFor(() => {
      expect(screen.getByText(/法人番号の重複で登録できなかった企業（1件）/)).toBeInTheDocument()
      expect(screen.getByText(/入力内容の不備で登録できなかった企業（1件）/)).toBeInTheDocument()
      expect(screen.getByText(/その他のエラー（1件）/)).toBeInTheDocument()
      expect(screen.getByText(/法人番号未入力の企業が 1 件ありました/)).toBeInTheDocument()
    })

    setTimeoutSpy.mockRestore()
  })

  it('handles errors during import gracefully', async () => {
    parseCSVMock.mockReturnValue([{ name: 'Example' }])
    validateCSVDataMock.mockReturnValue([])
    convertCSVToCompanyDataMock.mockImplementation(() => {
      throw new Error('convert failed')
    })

    const realSetTimeout = global.setTimeout
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (typeof delay === 'number' && delay === 100) {
          if (typeof callback === 'function') {
            callback(...args)
          }
          return 0 as unknown as NodeJS.Timeout
        }
        return realSetTimeout(callback, delay as number, ...args)
      })

    render(<CSVImportDialog open onOpenChange={() => {}} onImport={onImport} />)

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })

    const file = createCSVFile('Company Name,Industry\nExample,IT')

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('インポート開始（1件）')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('インポート開始（1件）'))
    })

    expect(convertCSVToCompanyDataMock).toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(screen.getByText('戻る'))
    })

    expect(screen.getByText(/インポート処理でエラーが発生しました/)).toBeInTheDocument()

    setTimeoutSpy.mockRestore()
  })
})
