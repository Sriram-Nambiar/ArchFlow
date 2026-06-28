import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Real-time collaborative system design workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          ui={ui}
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--bg-base)",
              colorForeground: "var(--text-primary)",
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorInput: "var(--bg-surface)",
              colorInputForeground: "var(--text-primary)",
              colorBorder: "var(--border-default)",
              colorNeutral: "var(--text-primary)",
              colorMuted: "var(--bg-subtle)",
              colorMutedForeground: "var(--text-muted)",
              colorDanger: "var(--state-error)",
              colorSuccess: "var(--state-success)",
              colorWarning: "var(--state-warning)",
              colorRing: "var(--accent-primary)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-sans)",
              fontFamilyButtons: "var(--font-sans)",
            },
          }}
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}