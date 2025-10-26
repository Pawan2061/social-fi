"use client";

import React, { useState } from "react";
import { UserPassOwnership } from "@/types/profile/profile-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PassesComponentProps {
    passes: UserPassOwnership[];
}

// Tiny inline icons to avoid new dependencies
const Icon = {
    Coin: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
            <circle cx="12" cy="12" r="10" fill="#FCD34D" stroke="#000" strokeWidth="2" />
            <path d="M8 12h8M10 8h4M10 16h4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Token: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
            <rect x="3" y="6" width="18" height="12" rx="2" fill="#BFDBFE" stroke="#000" strokeWidth="2" />
            <path d="M7 12h10" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Vault: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
            <rect x="4" y="5" width="16" height="14" rx="2" fill="#DDD6FE" stroke="#000" strokeWidth="2" />
            <circle cx="9" cy="12" r="2.5" fill="#A78BFA" stroke="#000" strokeWidth="2" />
            <path d="M14 9h5M14 12h5M14 15h5" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Calendar: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
            <rect x="3" y="5" width="18" height="16" rx="2" fill="#BBF7D0" stroke="#000" strokeWidth="2" />
            <path d="M3 9h18" stroke="#000" strokeWidth="2" />
            <path d="M8 3v4M16 3v4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Check: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
            <rect x="3" y="3" width="18" height="18" rx="3" fill="#86EFAC" stroke="#000" strokeWidth="2" />
            <path d="M7 12l3 3 7-7" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Copy: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="14" height="14" {...props}>
            <rect x="9" y="9" width="11" height="11" rx="2" fill="#93C5FD" stroke="#000" strokeWidth="2" />
            <rect x="4" y="4" width="11" height="11" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
        </svg>
    ),
};

const truncate = (s: string, left = 8, right = 6) =>
    s.length > left + right + 3 ? `${s.slice(0, left)}…${s.slice(-right)}` : s;

export default function PassesComponent({ passes }: PassesComponentProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copy = async (value: string, key: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1200);
        } catch {
            // ignore
        }
    };

    if (passes.length === 0) {
        return (
            <Card className="border-4 border-black shadow-[8px_8px_0_0_#000] bg-white transform -rotate-1">
                <CardContent className="p-8 text-center">
                    <h3 className="font-extrabold text-xl mb-2">No Passes Owned</h3>
                    <p className="text-gray-600 font-bold">
                        You haven&apos;t purchased any creator passes yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-4 border-black shadow-[8px_8px_0_0_#000] bg-white transform rotate-1 hover:rotate-0 transition-transform">
            <CardHeader className="border-b-4 border-black bg-green-300 relative">
                <CardTitle className="font-black text-2xl flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 bg-white border-3 border-black px-2 py-1 shadow-[3px_3px_0_0_#000]">
                        <Icon.Check />
                        <span>Your Passes</span>
                    </span>
                    <span className="ml-2 text-base font-extrabold bg-yellow-300 px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
                        {passes.length}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {passes.map((po, index) => {
                        const cardRotate = index % 2 === 0 ? "rotate-1" : "-rotate-1";
                        const tokenKey = `token-${po.id}`;
                        const vaultKey = `vault-${po.id}`;
                        return (
                            <div
                                key={po.id}
                                className={`relative border-4 border-black p-4 shadow-[6px_6px_0_0_#000] transform ${cardRotate} hover:rotate-0 transition-transform`}
                                style={{
                                    background:
                                        "repeating-linear-gradient(135deg, #EFF6FF 0 10px, #E9D5FF 10px 20px)",
                                }}
                            >
                                <div className="space-y-3">
                                    {/* Top row: title + price pill */}
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-lg bg-white px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                                            Pass #{po.pass.id}
                                        </h4>
                                        <div className="inline-flex items-center gap-1 bg-yellow-300 border-3 border-black px-3 py-1 shadow-[3px_3px_0_0_#000]">
                                            <Icon.Coin />
                                            <span className="font-extrabold text-sm">
                                                ${po.pass.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info blocks */}
                                    <div className="space-y-2">
                                        <div className="bg-white border-3 border-black p-2 shadow-[3px_3px_0_0_#000]">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Icon.Token />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm mb-0.5">Token Mint</p>
                                                        <p className="font-mono text-xs break-all truncate">
                                                            {truncate(po.pass.tokenMint)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => copy(po.pass.tokenMint, tokenKey)}
                                                    className="flex items-center gap-1 bg-blue-200 border-2 border-black px-2 py-1 text-xs font-extrabold shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
                                                    aria-label="Copy token mint"
                                                    title="Copy token mint"
                                                >
                                                    {copiedKey === tokenKey ? (
                                                        <>
                                                            <Icon.Check />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icon.Copy />
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white border-3 border-black p-2 shadow-[3px_3px_0_0_#000]">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Icon.Vault />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm mb-0.5">Vault Address</p>
                                                        <p className="font-mono text-xs break-all truncate">
                                                            {truncate(po.pass.vault_address)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => copy(po.pass.vault_address, vaultKey)}
                                                    className="flex items-center gap-1 bg-blue-200 border-2 border-black px-2 py-1 text-xs font-extrabold shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
                                                    aria-label="Copy vault address"
                                                    title="Copy vault address"
                                                >
                                                    {copiedKey === vaultKey ? (
                                                        <>
                                                            <Icon.Check />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icon.Copy />
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta row */}
                                    <div className="flex flex-wrap justify-between items-center text-sm gap-2">
                                        <span className="font-bold inline-flex items-center gap-2 bg-white px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                                            Creator ID: {po.creatorId}
                                        </span>
                                        <span className="font-bold text-gray-700 inline-flex items-center gap-2 bg-white px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                                            <Icon.Calendar />
                                            {new Date(po.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Access badge */}
                                    <div className="bg-green-200 border-3 border-black px-3 py-2 text-center shadow-[3px_3px_0_0_#000]">
                                        <span className="font-extrabold text-sm inline-flex items-center gap-2">
                                            <Icon.Check />
                                            Access Granted
                                        </span>
                                    </div>
                                </div>

                                {/* Corner flair */}
                                <div className="absolute -top-2 -left-2 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black"></div>
                            </div>
                        );
                    })}
                </div>

                {passes.length > 0 && (
                    <div className="mt-6 bg-blue-100 border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                        <h4 className="font-extrabold text-lg mb-2">Pass Benefits</h4>
                        <ul className="space-y-1 font-bold">
                            <li>• Access to premium content from creators</li>
                            <li>• Exclusive posts and media</li>
                            <li>• Support your favorite creators</li>
                            <li>• Trading and resale opportunities</li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}