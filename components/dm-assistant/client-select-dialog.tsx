"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Users } from "lucide-react"
import { useClients } from "@/hooks/use-clients"
import type { Client } from "@/lib/types"

interface ClientSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (client: Client) => void
}

export function ClientSelectDialog({ open, onOpenChange, onSelect }: ClientSelectDialogProps) {
  const [search, setSearch] = useState("")
  const { clients, loading } = useClients({
    limit: 100,
    filters: { is_active: true },
  })

  const filteredClients = search.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : clients

  const handleSelect = (client: Client) => {
    onSelect(client)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            クライアントを選択
          </DialogTitle>
          <DialogDescription>
            クライアントを選択すると、その情報が入力欄に反映されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="クライアント名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {search.trim() ? "該当するクライアントがありません" : "クライアントが登録されていません"}
              </div>
            ) : (
              <ul className="divide-y">
                {filteredClients.map((client) => (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(client)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium">{client.name}</p>
                        {(client.industry || client.contact_person) && (
                          <p className="text-sm text-muted-foreground">
                            {[client.industry, client.contact_person].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        選択
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
