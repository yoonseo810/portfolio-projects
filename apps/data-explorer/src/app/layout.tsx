import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@repo/ui/site-header";
import { themeScript } from "@repo/ui/theme";
import { BASE_PATH } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TTC Delay Explorer",
  description: "Explore Toronto subway delay incidents by date, line, station, cause and hour.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader brand="TTC Delay Explorer" href={BASE_PATH} maxWidth="max-w-6xl">
          {/* The portfolio is another zone on this domain, so these are full page loads, not <Link>. */}
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
