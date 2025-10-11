"use client";

import { UserProfile } from "@/types/profile/profile-types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfileProps {
    user: UserProfile;
}

export default function UserProfileComponent({ user }: UserProfileProps) {
    return (
        <Card className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white transform rotate-1 hover:rotate-0 transition-transform">
            <CardHeader className="border-b-4 border-black bg-yellow-300 pb-3">
                <CardTitle className="font-black text-xl flex items-center gap-3">
                    <div className="relative">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={user.name}
                                width={60}
                                height={60}
                                className="w-15 h-15 border-3 border-black rounded-full object-cover shadow-[3px_3px_0_0_#000]"
                            />
                        ) : (
                            <div className="w-15 h-15 bg-white border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                                <span className="text-xl font-extrabold">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {user.emailVerified && (
                            <div className="absolute -top-1 -right-1 bg-green-400 border-2 border-black rounded-full w-5 h-5 flex items-center justify-center">
                                <span className="text-xs font-extrabold">✓</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-black">{user.name}</h1>
                        <p className="text-sm font-bold text-black/70">{user.email}</p>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Stats Cards */}
                    <div className="bg-blue-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000] transform -rotate-1">
                        <h3 className="font-extrabold text-sm">Posts</h3>
                        <p className="text-2xl font-black">{user.posts?.length ?? 0}</p>
                    </div>

                    <div className="bg-green-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                        <h3 className="font-extrabold text-sm">Passes Owned</h3>
                        <p className="text-2xl font-black">{user.passes?.length ?? 0}</p>
                    </div>

                    {user.pass && (
                        <div className="bg-purple-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000] transform rotate-1 col-span-2 md:col-span-1">
                            <h3 className="font-extrabold text-sm">Pass Price</h3>
                            <p className="text-2xl font-black">${user.pass.price.toFixed(2)}</p>
                        </div>
                    )}
                </div>

                {/* Wallet Info */}
                <div className="bg-gray-100 border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                    <h3 className="font-extrabold text-base mb-2">Wallet Address</h3>
                    <p className="font-mono text-xs bg-white border-2 border-black p-2 shadow-[2px_2px_0_0_#000] break-all">
                        {user.wallet}
                    </p>
                </div>

                {/* Pass Info if user has created a pass */}
                {user.pass && (
                    <div className="bg-yellow-100 border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                        <h3 className="font-extrabold text-base mb-2">Your Pass</h3>
                        <div className="space-y-1">
                            <p className="font-bold text-sm">Token: <span className="font-mono text-xs">{user.pass.tokenMint.slice(0, 20)}...</span></p>
                            <p className="font-bold text-sm">Vault: <span className="font-mono text-xs">{user.pass.vault_address.slice(0, 20)}...</span></p>
                            <p className="font-bold text-sm">Created: {new Date(user.pass.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}