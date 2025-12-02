import { copyToClipboard } from "@/lib/clipboard"

describe("copyToClipboard", () => {
  it("uses navigator.clipboard.writeText when available", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.assign(global, {
      navigator: {
        clipboard: {
          writeText: writeTextMock,
        },
      },
    })

    const result = await copyToClipboard("hello world")

    expect(writeTextMock).toHaveBeenCalledWith("hello world")
    expect(result).toBe(true)
  })

  it("falls back to document.execCommand when clipboard API is not available", async () => {
    Object.assign(global, {
      navigator: {},
    })

    const execCommandMock = jest
      .spyOn(document, "execCommand")
      // @ts-expect-error JSDOMでの戻り値型を簡略化
      .mockReturnValue(true)

    const result = await copyToClipboard("fallback test")

    expect(execCommandMock).toHaveBeenCalledWith("copy")
    expect(result).toBe(true)

    execCommandMock.mockRestore()
  })
}
)



