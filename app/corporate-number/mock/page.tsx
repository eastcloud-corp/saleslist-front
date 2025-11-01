"use client"

import { useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Building2, FileSpreadsheet, Search } from "lucide-react"

const MOCK_RESULTS = {
  number: {
    "1010001201234": {
      corporateNumber: "1010001201234",
      name: "株式会社サンプルテック",
      prefecture: "東京都",
      city: "千代田区",
      address: "千代田区丸の内1-1-1",
      status: "登録",
      updateDate: "2024/05/01",
    },
    "4010005009999": {
      corporateNumber: "4010005009999",
      name: "サンプルホールディングス株式会社",
      prefecture: "神奈川県",
      city: "横浜市西区",
      address: "横浜市西区みなとみらい2-2-1",
      status: "存続",
      updateDate: "2023/12/18",
    },
  },
  name: {
    "サンプル": [
      {
        corporateNumber: "1010001201234",
        name: "株式会社サンプルテック",
        prefecture: "東京都",
        city: "千代田区",
        address: "千代田区丸の内1-1-1",
        status: "登録",
        updateDate: "2024/05/01",
      },
      {
        corporateNumber: "4010005009999",
        name: "サンプルホールディングス株式会社",
        prefecture: "神奈川県",
        city: "横浜市西区",
        address: "横浜市西区みなとみらい2-2-1",
        status: "存続",
        updateDate: "2023/12/18",
      },
    ],
  },
} as const

type ResultRecord = (typeof MOCK_RESULTS)["number"][keyof (typeof MOCK_RESULTS)["number"]]

export default function CorporateNumberMockPage() {
  const [mode, setMode] = useState<"number" | "name">("number")
  const [corporateNumber, setCorporateNumber] = useState("1010001201234")
  const [companyName, setCompanyName] = useState("サンプル")
  const [prefecture, setPrefecture] = useState("東京都")
  const [results, setResults] = useState<ResultRecord[] | null>(null)
  const [searched, setSearched] = useState(false)

  const helperText = useMemo(() => {
    if (mode === "number") {
      return "法人番号（13桁）を入力して国税庁の公開データから基本情報を取得します。"
    }
    return "法人名と所在地都道府県を手掛かりに検索し、候補となる法人番号を一覧表示します。"
  }, [mode])

  const handleSearch = () => {
    setSearched(true)
    if (mode === "number") {
      const record = MOCK_RESULTS.number[corporateNumber as keyof typeof MOCK_RESULTS.number]
      setResults(record ? [record] : [])
    } else {
      const key = companyName.trim()
      const records = MOCK_RESULTS.name[key as keyof typeof MOCK_RESULTS.name]
      setResults(records ? [...records] : [])
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 lg:px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-[0.2em]">
              <Building2 className="h-4 w-4" />
              法人情報検索モック
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">法人番号 Web-API 利用イメージ</h1>
            <p className="text-sm text-muted-foreground">
              国税庁法人番号 Web-API を利用する検索 UI の想定です。法人番号または法人名から公的データを取得する操作フローを再現しています。
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <FileSpreadsheet className="h-4 w-4" /> デモ表示用
          </Badge>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg">検索条件</CardTitle>
            <CardDescription>{helperText}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "number" | "name")}> 
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="number">法人番号から検索</TabsTrigger>
                <TabsTrigger value="name">法人名から検索</TabsTrigger>
              </TabsList>
              <TabsContent value="number" className="mt-6 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="corporate-number">法人番号</Label>
                  <Input
                    id="corporate-number"
                    value={corporateNumber}
                    onChange={(event) => setCorporateNumber(event.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="例: 1010001201234"
                    maxLength={13}
                  />
                </div>
              </TabsContent>
              <TabsContent value="name" className="mt-6 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="company-name">法人名</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="例: サンプル"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prefecture">所在地の都道府県</Label>
                  <Input
                    id="prefecture"
                    value={prefecture}
                    onChange={(event) => setPrefecture(event.target.value)}
                    placeholder="例: 東京都"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                取得をシミュレーション
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg">取得結果</CardTitle>
            <CardDescription>
              国税庁 Web-API のレスポンス例を元にしたモックデータです。実際の API では JSON 形式で返却されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {searched && results && results.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                条件に一致する法人が見つかりませんでした。法人名の揺れや所在地を再確認してください。
              </div>
            ) : null}

            {!searched && (
              <div className="rounded-md border border-muted-foreground/10 bg-muted/40 px-6 py-5 text-sm text-muted-foreground">
                画面右上の検索条件を設定し「取得をシミュレーション」を押すと、モック結果が表示されます。
              </div>
            )}

            {results && results.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-md border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>法人番号</TableHead>
                      <TableHead>法人名</TableHead>
                      <TableHead>所在地</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>更新日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((record) => (
                      <TableRow key={record.corporateNumber}>
                        <TableCell className="font-mono text-sm">
                          {record.corporateNumber}
                        </TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.prefecture} {record.city}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{record.updateDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
