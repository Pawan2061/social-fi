"use client";

import { UserPassOwnership } from "@/types/profile/profile-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PassesComponentProps {
    passes: UserPassOwnership[];
}

export default function PassesComponent({ passes }: PassesComponentProps) {
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
            <CardHeader className="border-b-4 border-black bg-green-300">
                <CardTitle className="font-black text-2xl">
                    Your Passes ({passes.length})
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {passes.map((passOwnership, index) => (
                        <div
                            key={passOwnership.id}
                            className={`bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-black p-4 shadow-[6px_6px_0_0_#000] transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"
                                } hover:rotate-0 transition-transform`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-lg">Pass #{passOwnership.pass.id}</h4>
                                    <div className="bg-yellow-300 border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_#000]">
                                        <span className="font-extrabold text-sm">
                                            ${passOwnership.pass.price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0_0_#000]">
                                        <p className="font-bold text-sm mb-1">Token Mint:</p>
                                        <p className="font-mono text-xs break-all">
                                            {passOwnership.pass.tokenMint}
                                        </p>
                                    </div>

                                    <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0_0_#000]">
                                        <p className="font-bold text-sm mb-1">Vault Address:</p>
                                        <p className="font-mono text-xs break-all">
                                            {passOwnership.pass.vault_address}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold">
                                        Creator ID: {passOwnership.creatorId}
                                    </span>
                                    <span className="font-bold text-gray-600">
                                        Purchased: {new Date(passOwnership.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="bg-green-200 border-2 border-black p-2 text-center">
                                    <span className="font-extrabold text-sm">✓ Access Granted</span>
                                </div>
                            </div>
                        </div>
                    ))}
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