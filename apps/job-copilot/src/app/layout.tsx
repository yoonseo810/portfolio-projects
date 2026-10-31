import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@repo/ui/site-header";
import { themeScript } from "@repo/ui/theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job-Search Copilot",
  description: "Turn a job posting into a fit score, a gap list and tailored resume bullets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader brand="Job-Search Copilot" maxWidth="max-w-4xl">
          <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg">
            Dashboard
          </Link>
        </SiteHeader>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-muted sm:px-6">
          Part of{" "}
          <a href="https://portfolio-projects-wine.vercel.app" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
            Michael Seo&apos;s portfolio
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
