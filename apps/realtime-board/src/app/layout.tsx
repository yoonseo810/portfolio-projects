import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader } from "@repo/ui/site-header";
import { themeScript } from "@repo/ui/theme";
import { HeaderAccount, HeaderAccountFallback } from "@/components/HeaderAccount";
import { BASE_PATH } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Realtime Board",
  description: "A shareable kanban board with live cursors, presence, and drag and drop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader brand="Realtime Board" href={BASE_PATH} maxWidth="max-w-6xl">
          <Suspense fallback={<HeaderAccountFallback />}>
            <HeaderAccount />
          </Suspense>
        </SiteHeader>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
