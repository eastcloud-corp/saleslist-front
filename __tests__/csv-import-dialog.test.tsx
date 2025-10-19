import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { CSVImportDialog } from '@/components/companies/csv-import-dialog'

jest.mock('@/components/companies/csv-template-download', () => ({
  CSVTemplateDownload: () => <div data-testid="csv-template" />,
}))

const parseCSVMock = jest.fn()
const validateCSVDataMock = jest.fn()

jest.mock('@/lib/csv-utils', () => ({
  parseCSV: (...args: unknown[]) => parseCSVMock(...args),
  validateCSVData: (...args: unknown[]) => validateCSVDataMock(...args),
}))

const defaultSummary = () => ({
  successCount: 1,
  companyUpdatedCount: 0,
  executiveCreatedCount: 0,
  executiveUpdatedCount: 0,
  errorItems: [] as Array<{ name: string; message: string; category: string }>,
  missingCorporateNumberCount: 0,
  duplicateCount: 0,
  totalRows: 1,
})

const createCSVFile = (content: string, name = 'companies.csv') => {
  const file = new File([content], name, { type: 'text/csv' })
  Object.defineProperty(file, 'text', {
    configurable: true,
    value: jest.fn(() => Promise.resolve(content)),
  })
  return file
}

const createSummary = (overrides: Partial<ReturnType<typeof defaultSummary>> = {}) => ({
  ...defaultSummary(),
  ...overrides,
})

describe('CSVImportDialog', () => {
  const onOpenChange = jest.fn()
  const onImport = jest.fn().mockResolvedValue(defaultSummary())

  beforeEach(() => {
    parseCSVMock.mockReset()
    validateCSVDataMock.mockReset()
    onImport.mockReset()
    onOpenChange.mockReset()
    onImport.mockResolvedValue(defaultSummary())
  })

  it('shows validation errors when CSV has issues', async () => {
    parseCSVMock.mockReturnValue([{ name: '' }])
    validateCSVDataMock.mockReturnValue([
      {
        row: 2,
        field: 'name',
        value: '',
        message: '「企業名」列: 必須項目です',
      },
    ])

    render(<CSVImportDialog open onOpenChange={onOpenChange} onImport={onImport} />)

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createCSVFile('Company Name\n')] } })
    })

    await waitFor(() => {
      expect(screen.getByText(/エラーを検出しました/)).toBeInTheDocument()
      expect(parseCSVMock).toHaveBeenCalled()
      expect(validateCSVDataMock).toHaveBeenCalled()
    })

    expect(screen.queryByText(/インポート開始/)).not.toBeInTheDocument()
  })

  it('imports data successfully after validation', async () => {
    const csvRows = [{ name: 'Example', industry: 'IT' }]
    parseCSVMock.mockReturnValue(csvRows)
    validateCSVDataMock.mockReturnValue([])

    render(<CSVImportDialog open onOpenChange={onOpenChange} onImport={onImport} />)

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
      expect(onImport).toHaveBeenCalledWith(file, { rowCount: csvRows.length }, expect.any(Function))
      expect(screen.getByText('インポートが完了しました')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('閉じる'))
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('displays categorized summary when import reports duplicates and validation errors', async () => {
    parseCSVMock.mockReturnValue([{ name: 'Example' }])
    validateCSVDataMock.mockReturnValue([])

    onImport.mockImplementationOnce(async (_file, _context, onProgress) => {
      onProgress(100)
      return createSummary({
        successCount: 0,
        missingCorporateNumberCount: 1,
        errorItems: [
          { name: 'Row1', message: 'duplicate error', category: 'duplicate' },
          { name: 'Row2', message: 'validation error', category: 'validation' },
          { name: 'Row3', message: 'api error', category: 'api' },
        ],
        duplicateCount: 1,
      })
    })

    render(<CSVImportDialog open onOpenChange={onOpenChange} onImport={onImport} />)

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })

    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [createCSVFile('Company Name,Corporate Number\nExample,1234567890123')] },
      })
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
  })

  it('handles errors during import gracefully', async () => {
    parseCSVMock.mockReturnValue([{ name: 'Example' }])
    validateCSVDataMock.mockReturnValue([])
    onImport.mockRejectedValueOnce(new Error('upload failed'))

    render(<CSVImportDialog open onOpenChange={onOpenChange} onImport={onImport} />)

    const fileInput = await waitFor(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!input) {
        throw new Error('file input not rendered')
      }
      return input
    })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createCSVFile('Company Name\nExample')] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('インポート開始（1件）'))
    })

    await waitFor(() => {
      expect(
        screen.getByText((content) =>
          content.includes('インポート処理でエラーが発生しました。内容を確認して再度お試しください。'),
        ),
      ).toBeInTheDocument()
      expect(onImport).toHaveBeenCalled()
    })
  })
})
