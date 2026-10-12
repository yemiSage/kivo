"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, InfoIcon, WarningIcon, XIcon } from "@/components/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CheckIcon size={18} />,
        info: <InfoIcon size={18} />,
        warning: <WarningIcon size={18} />,
        error: <XIcon size={18} className="text-destructive" />,
      }}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "var(--foreground)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      offset={{ bottom: 96 }}
      mobileOffset={{ bottom: 96 }}
      {...props}
    />
  )
}

export { Toaster }
