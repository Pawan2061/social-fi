import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

import Navbar from "@/components/ui/navbar";
import { BrutalGrid, NoiseOverlay } from "@/components/ui/backgrounds";
import { SolanaWalletProvider } from "@/providers/WalletProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Fi - Web3 Safety Net for Content Creators",
  description:
    "A community-driven safety net that fuses NFT fan passes + insurance pools + AI assistance. Protect creators from financial fragility with transparent, on-chain protection.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.995 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.14 0.02 260)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <BrutalGrid />
        <NoiseOverlay />
        <div className="relative z-10">
          <QueryProvider>
            <SolanaWalletProvider>
              <AuthProvider>
                <Navbar />
                {children}
              </AuthProvider>
            </SolanaWalletProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
