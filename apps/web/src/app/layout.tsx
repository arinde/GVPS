import type { Metadata } from "next";
import { IBM_Plex_Mono, Kumbh_Sans } from "next/font/google";
import { ShellSwitch } from "@/components/layout/shell-switch";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/store/store-provider";
import "./globals.css";

// STITCH-GLOBAL.md §3: Kumbh Sans for all text, in the four weights the
// design uses. IBM Plex Mono only for codes such as admission numbers and
// timestamps. Mapped to Tailwind in globals.css.
const kumbhSans = Kumbh_Sans({
  variable: "--font-kumbh",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${kumbhSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Client boundary starts here so pages below stay server components (AGENTS.md §3). */}
        <StoreProvider>
          <ShellSwitch>{children}</ShellSwitch>
        </StoreProvider>
        {/* Mounted once; everything else calls notify from @/lib/notify. Top
            centre so it is seen on a phone, where the corners sit under thumbs. */}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
