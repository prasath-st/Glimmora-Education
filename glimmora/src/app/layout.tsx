import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { MswProvider } from "@/lib/providers/msw-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { Toaster } from "sonner";
import { DevRoleSwitcher } from "@/components/layout/dev-role-switcher";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glimmora — Education Intelligence Platform",
  description:
    "AI-native multi-tenant education intelligence infrastructure for universities, research institutions, and ministries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <MswProvider>
            <QueryProvider>
              {children}
              <DevRoleSwitcher />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className: "bg-card text-card-foreground border-border",
                }}
              />
            </QueryProvider>
          </MswProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
