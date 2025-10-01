"use client";
import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b-4 border-foreground shadow-[6px_6px_0_0_#000]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="bg-yellow-300 text-black px-2 py-1 border-4 border-foreground shadow-[4px_4px_0_0_#000] font-extrabold text-sm">
            CID
          </span>
          <span className="font-extrabold text-lg">Creator Insurance DAO</span>
        </Link>
        {/* <nav className="flex items-center gap-2 sm:gap-3">
          <a href="#problem" className="px-3 py-1.5 border-4 border-foreground bg-white font-extrabold shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-sm">
            Problem
          </a>
          <a href="#solution" className="px-3 py-1.5 border-4 border-foreground bg-white font-extrabold shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-sm">
            Solution
          </a>
          <a href="#future" className="px-3 py-1.5 border-4 border-foreground bg-white font-extrabold shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-sm">
            Future
          </a>
          <a href="#hero" className="px-3 py-1.5 border-4 border-foreground bg-yellow-300 text-black font-extrabold shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-sm">
            Launch App
          </a>
        </nav> */}
      </div>
    </header>
  );
}
