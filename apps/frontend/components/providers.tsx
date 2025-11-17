"use client"

import type React from "react"
import { config } from "@/lib/wagmiConfig"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export function Providers({ children }: { children: React.ReactNode }) {
      const queryClient = new QueryClient()
  return (
      
      <WagmiProvider config={config}>
       <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
    </WagmiProvider>
  )
}