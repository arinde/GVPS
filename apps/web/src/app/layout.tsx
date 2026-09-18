import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Baskerville } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/store/store-provider";
import "./globals.css";

// The three families the design system pairs strictly: Libre Baskerville for
// headings and large figures, IBM Plex Sans for interface and data, IBM Plex
// Mono for timestamps and reference codes. Mapped to Tailwind in globals.css.
const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GVPS",
  description: "School management system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${libreBaskerville.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Client boundary starts here so pages below stay server components (AGENTS.md §3). */}
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
        {/* Mounted once; everything else calls notify from @/lib/notify. Top
            centre so it is seen on a phone, where the corners sit under thumbs. */}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
