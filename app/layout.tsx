import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SettingsProvider } from "@/lib/contexts/SettingsContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AeroTodo — Minimal Task Planner",
  description: "A minimal, fast, and beautiful task planner. Open source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              {children}
              <Toaster 
                position="bottom-right" 
                closeButton
                toastOptions={{
                  style: {
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    padding: '12px 16px',
                  },
                  className: 'font-mono text-sm',
                  duration: 4000,
                }}
              />
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
