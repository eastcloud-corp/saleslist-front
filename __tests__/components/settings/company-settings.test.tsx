import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CompanySettings } from "@/components/settings/company-settings"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("CompanySettings", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    ;(apiClient.get as jest.Mock).mockRejectedValue(new Error("API not available"))
    ;(apiClient.post as jest.Mock).mockResolvedValue({})
  })

  it("renders company settings form with all fields", async () => {
    await act(async () => {
      render(<CompanySettings />)
    })

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("設定を読み込み中...")).not.toBeInTheDocument()
    })

    // Check if all required form fields are present
    expect(screen.getByLabelText("会社名 *")).toBeInTheDocument()
    expect(screen.getByLabelText("代表者名")).toBeInTheDocument()
    expect(screen.getByLabelText("設立年")).toBeInTheDocument()
    expect(screen.getByLabelText("従業員数")).toBeInTheDocument()
    expect(screen.getByLabelText("電話番号")).toBeInTheDocument()
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument()
    expect(screen.getByLabelText("ウェブサイト")).toBeInTheDocument()
    expect(screen.getByLabelText("郵便番号")).toBeInTheDocument()
    expect(screen.getByLabelText("住所")).toBeInTheDocument()
    expect(screen.getByLabelText("会社概要")).toBeInTheDocument()

    // Check for buttons
    expect(screen.getByRole("button", { name: /設定を保存/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /リセット/ })).toBeInTheDocument()
  })

  it("validates required fields", async () => {
    await act(async () => {
      render(<CompanySettings />)
    })

    await waitFor(() => {
      expect(screen.queryByText("設定を読み込み中...")).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole("button", { name: /設定を保存/ })
    await user.click(saveButton)

    expect(screen.getByText("会社名は必須です")).toBeInTheDocument()
  })

  it("validates email format", async () => {
    await act(async () => {
      render(<CompanySettings />)
    })

    await waitFor(() => {
      expect(screen.queryByText("設定を読み込み中...")).not.toBeInTheDocument()
    })

    const companyNameInput = screen.getByLabelText("会社名 *")
    const emailInput = screen.getByLabelText("メールアドレス")
    const saveButton = screen.getByRole("button", { name: /設定を保存/ })

    await user.type(companyNameInput, "テスト株式会社")
    await user.type(emailInput, "invalid-email")
    await user.click(saveButton)

    expect(await screen.findByText("無効なメール形式です")).toBeInTheDocument()
  })

  it("saves settings successfully", async () => {
    await act(async () => {
      render(<CompanySettings />)
    })

    await waitFor(() => {
      expect(screen.queryByText("設定を読み込み中...")).not.toBeInTheDocument()
    })

    const companyNameInput = screen.getByLabelText("会社名 *")
    const phoneInput = screen.getByLabelText("電話番号")
    const emailInput = screen.getByLabelText("メールアドレス")
    const saveButton = screen.getByRole("button", { name: /設定を保存/ })

    await user.type(companyNameInput, "テスト株式会社")
    await user.type(phoneInput, "03-1234-5678")
    await user.type(emailInput, "test@example.com")
    await user.click(saveButton)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "company_settings",
        expect.stringContaining("テスト株式会社")
      )
      expect(toast).toHaveBeenCalledWith({
        title: "設定を保存しました",
        description: "会社情報が正常に保存されました",
      })
    })
  })

  it("resets form when reset button is clicked", async () => {
    await act(async () => {
      render(<CompanySettings />)
    })

    await waitFor(() => {
      expect(screen.queryByText("設定を読み込み中...")).not.toBeInTheDocument()
    })

    const companyNameInput = screen.getByLabelText("会社名 *")
    const resetButton = screen.getByRole("button", { name: /リセット/ })

    await user.type(companyNameInput, "テスト株式会社")
    await user.click(resetButton)

    expect(companyNameInput).toHaveValue("")
    expect(toast).toHaveBeenCalledWith({
      title: "設定をリセットしました",
      description: "フォームが初期状態に戻りました",
    })
  })
})
