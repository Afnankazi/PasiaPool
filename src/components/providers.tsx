"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"

export function Providers({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <SessionProvider refetchInterval={5 * 60}>
            <NextThemesProvider {...props}>
                {children}
                <Toaster 
                    position="top-center"
                    richColors
                    expand={true}
                    closeButton
                />
            </NextThemesProvider>
        </SessionProvider>
    )
}