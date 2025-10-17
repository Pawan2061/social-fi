"use client";
import React from "react";
import Link from "next/link";
import WalletAuthButton from "./wallet-login-button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b-4 border-foreground shadow-[6px_6px_0_0_#000]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="bg-yellow-300 text-black px-2 py-1 border-4 border-foreground shadow-[4px_4px_0_0_#000] font-extrabold text-sm">
            SF
          </span>
          <span className="font-extrabold text-lg">Social Fi</span>
        </Link>
        <WalletAuthButton />
      </div>
    </header>
  );
}
