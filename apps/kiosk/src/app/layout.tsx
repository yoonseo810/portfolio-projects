import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@repo/ui/site-header";
import { themeScript } from "@repo/ui/theme";
import { BASE_PATH } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kiosk Check-in",
  description: "A touch-first airline check-in kiosk with seat selection, bags, boarding passes and English/French.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader brand="Kiosk Check-in" href={BASE_PATH} maxWidth="max-w-5xl">
          {/* The portfolio is another zone on this domain, so this is a full page load, not <Link>. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg">
            Portfolio
          </a>
        </SiteHeader>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
