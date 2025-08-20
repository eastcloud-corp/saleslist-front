"use client"

import type React from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FormFieldProps {
  label: string
  id: string
  error?: string
  required?: boolean
  children?: React.ReactNode
}

export function FormField({ label, id, error, required, children }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  )
}

interface TextFieldProps extends FormFieldProps {
  type?: "text" | "email" | "url" | "number"
  value: string | number
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  min?: number
}

export function TextField({
  type = "text",
  value,
  onChange,
  disabled,
  placeholder,
  min,
  error,
  ...fieldProps
}: TextFieldProps) {
  return (
    <FormField error={error} {...fieldProps}>
      <Input
        id={fieldProps.id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        className={error ? "border-destructive" : ""}
      />
    </FormField>
  )
}

interface TextAreaFieldProps extends FormFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  rows?: number
}

export function TextAreaField({
  value,
  onChange,
  disabled,
  placeholder,
  rows = 4,
  error,
  ...fieldProps
}: TextAreaFieldProps) {
  return (
    <FormField error={error} {...fieldProps}>
      <Textarea
        id={fieldProps.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
      />
    </FormField>
  )
}

interface SelectFieldProps extends FormFieldProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ value, onChange, options, placeholder, error, ...fieldProps }: SelectFieldProps) {
  return (
    <FormField error={error} {...fieldProps}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
