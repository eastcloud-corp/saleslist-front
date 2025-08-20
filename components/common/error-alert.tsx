"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface ErrorAlertProps {
  title?: string
  message: string
  errors?: string[]
}

export function ErrorAlert({ title = "Error", message, errors }: ErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>{title}:</strong> {message}
        {errors && errors.length > 0 && (
          <ul className="list-disc list-inside mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">
                {error}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  )
}
