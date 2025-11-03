import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const GENERAL_GUIDE_PATHS = [
  path.join(process.cwd(), "..", "saleslist-docs", "user-guide-general.md"),
  path.join(process.cwd(), "saleslist-docs", "user-guide-general.md"),
  path.join(process.cwd(), "user-guide-general.md"),
]

const ADMIN_GUIDE_PATHS = [
  path.join(process.cwd(), "..", "saleslist-docs", "user-guide-admin.md"),
  path.join(process.cwd(), "saleslist-docs", "user-guide-admin.md"),
  path.join(process.cwd(), "user-guide-admin.md"),
]

export const dynamic = "force-dynamic"

function loadGuide(paths: string[]): string {
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8")
      }
    } catch (error) {
      console.error(`Failed to read user guide at ${filePath}:`, error)
    }
  }

  return [
    "# 利用ガイドが見つかりません",
    "",
    "現在、利用ガイドを読み込めませんでした。管理者にお問い合わせください。",
  ].join("\n")
}

export const metadata: Metadata = {
  title: "ユーザーガイド | ソーシャルナビゲーター",
}

const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-3xl font-bold mt-10 first:mt-0 border-b border-border pb-3" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-2xl font-semibold mt-8 first:mt-0 border-l-4 border-primary pl-3" {...props} />
  ),
  h3: ({ node, ...props }: any) => <h3 className="text-xl font-semibold mt-6" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-lg font-semibold mt-4" {...props} />,
  p: ({ node, ...props }: any) => <p className="text-[15px] leading-relaxed text-muted-foreground" {...props} />,
  ul: ({ node, ordered, ...props }: any) => (
    <ul className="list-disc pl-6 space-y-2 text-[15px] leading-relaxed text-muted-foreground" {...props} />
  ),
  ol: ({ node, ordered, ...props }: any) => (
    <ol className="list-decimal pl-6 space-y-2 text-[15px] leading-relaxed text-muted-foreground" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="space-y-1" {...props} />,
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-primary/30 bg-primary/5 px-4 py-3 text-[15px] text-muted-foreground italic rounded-md"
      {...props}
    />
  ),
  code: ({ inline, ...props }: any) =>
    inline ? (
      <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono text-foreground" {...props} />
    ) : (
      <code
        className="block rounded-md bg-muted px-4 py-3 text-sm font-mono text-foreground whitespace-pre-wrap"
        {...props}
      />
    ),
  pre: ({ node, ...props }: any) => (
    <pre className="rounded-md bg-muted/70 p-4 text-sm font-mono text-muted-foreground shadow-inner" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th className="border border-border bg-muted/50 px-3 py-2 text-left font-medium text-foreground" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="border border-border px-3 py-2 text-muted-foreground align-top" {...props} />
  ),
  a: ({ node, ...props }: any) => (
    <a
      {...props}
      className="font-medium text-primary underline underline-offset-[6px] hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
}

export default function UserGuidePage() {
  const generalGuide = loadGuide(GENERAL_GUIDE_PATHS)
  const adminGuide = loadGuide(ADMIN_GUIDE_PATHS)

  return (
    <MainLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 lg:px-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-[0.2em]">
              <BookOpen className="h-4 w-4" />
              ユーザーガイド
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Ops ハンドブック</h1>
            <p className="text-sm text-muted-foreground">
              利用者向けと管理者向けの手順書を切り替えて閲覧できます。
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">一般ユーザー向け</TabsTrigger>
            <TabsTrigger value="admin">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                管理者向け
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/30">
                <CardTitle className="text-lg font-semibold text-foreground">一般ユーザーガイド</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  企業管理や案件作業など、日常オペレーションで必要な操作をまとめています。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-6 px-6 py-8 [&>div]:space-y-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                    {generalGuide}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  管理者向けオペレーション
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  データ収集ジョブのスケジュールやレビュー監査など、管理者専用の手順を記載しています。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-6 px-6 py-8 [&>div]:space-y-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                    {adminGuide}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
