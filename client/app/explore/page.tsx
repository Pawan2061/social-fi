"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Sparkles,
  Vote,
  Zap,
  Heart,
  TrendingUp,
  Lock,
  Unlock,
  Coins,
  Globe,
} from "lucide-react";
import { BrutalGrid, NoiseOverlay } from "@/components/ui/backgrounds";

export default function ExplorePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Creator Protection Pool",
      description:
        "A transparent, on-chain treasury that protects creators from financial setbacks. A percentage of every Fan Pass sale flows into the pool.",
      color: "bg-blue-300",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "NFT Fan Passes",
      description:
        "Exclusive, tradable NFTs that unlock premium content and give you voting power. Early supporters benefit when creators succeed.",
      color: "bg-purple-300",
    },
    {
      icon: <Vote className="w-8 h-8" />,
      title: "DAO Governance",
      description:
        "Fans decide on creator claims through transparent, on-chain voting. Your NFT pass = your voice. More than passive support.",
      color: "bg-green-300",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI-Powered",
      description:
        "Smart summaries, translations, and plain-English insights make the platform accessible to everyone, everywhere.",
      color: "bg-pink-300",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Access",
      description:
        "Buy a Fan Pass NFT and immediately unlock exclusive content. No subscriptions, no recurring fees—just ownership.",
      color: "bg-yellow-300",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Real Support",
      description:
        "When creators face setbacks, the community steps in. Vote on claims, approve payouts, and make a real difference.",
      color: "bg-red-300",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Creators Mint Fan Pass NFTs",
      description:
        "Creators launch their NFT collection. Each pass grants exclusive access to premium content.",
      icon: <Unlock className="w-6 h-6" />,
    },
    {
      step: "2",
      title: "Fans Buy & Unlock Content",
      description:
        "Purchase a Fan Pass NFT to access creator content. A portion automatically goes to the Protection Pool.",
      icon: <Lock className="w-6 h-6" />,
    },
    {
      step: "3",
      title: "Creators File Claims",
      description:
        "When facing setbacks, creators file claims with evidence. AI summarizes everything for easy understanding.",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      step: "4",
      title: "Fans Vote & Approve",
      description:
        "Pass holders vote on claims. Transparent, on-chain governance ensures fair decisions.",
      icon: <Vote className="w-6 h-6" />,
    },
    {
      step: "5",
      title: "Automatic Payouts",
      description:
        "Approved claims trigger automatic, transparent payouts from the Protection Pool. Creators get support instantly.",
      icon: <Coins className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <BrutalGrid />
      <NoiseOverlay />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div
              className={`inline-block mb-6 transform transition-all duration-700 ${
                mounted ? "rotate-0 scale-100" : "rotate-12 scale-90"
              }`}
            >
              <span className="bg-yellow-300 text-black px-6 py-3 border-4 border-black shadow-[6px_6px_0_0_#000] font-extrabold text-xl transform -rotate-1">
                🎯 EXPLORE THE PLATFORM
              </span>
            </div>

            <h1
              className={`text-6xl md:text-8xl font-black mb-6 transition-all duration-1000 ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Creator Insurance
              </span>
              <br />
              <span className="text-black">DAO</span>
            </h1>

            <p
              className={`text-xl md:text-2xl font-bold text-black max-w-3xl mx-auto mb-8 transition-all duration-1000 delay-200 ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <span className="bg-pink-200 px-4 py-2 border-3 border-black inline-block transform -rotate-1">
                Patreon + TikTok + Mutual Insurance
              </span>
              <br className="my-4" />
              <span className="text-lg font-normal">
                A community-driven safety net that protects creators from
                financial fragility through NFT Fan Passes, transparent
                insurance pools, and AI-powered assistance.
              </span>
            </p>

            <div
              className={`flex gap-4 justify-center flex-wrap transition-all duration-1000 delay-400 ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Link href="/feed">
                <Button
                  size="lg"
                  className="bg-purple-400 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold text-lg px-8 py-4 transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Explore Feed
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  size="lg"
                  className="bg-cyan-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold text-lg px-8 py-4 transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div
              className={`bg-red-100 border-4 border-black p-8 shadow-[8px_8px_0_0_#000] transform transition-all duration-700 delay-100 ${
                mounted ? "rotate-1" : "rotate-6"
              }`}
            >
              <h2 className="text-3xl font-black mb-4 flex items-center">
                <span className="bg-red-400 px-3 py-1 border-2 border-black mr-2">
                  ⚠️
                </span>
                The Problem
              </h2>
              <ul className="space-y-3 text-lg font-bold">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Creators face unpredictable income and financial fragility
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Traditional insurance doesn&apos;t cover digital livelihoods
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Fans remain passive supporters instead of empowered backers
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Bans, demonetization, and setbacks can wipe out revenue
                    overnight
                  </span>
                </li>
              </ul>
            </div>

            <div
              className={`bg-green-100 border-4 border-black p-8 shadow-[8px_8px_0_0_#000] transform transition-all duration-700 delay-200 ${
                mounted ? "-rotate-1" : "-rotate-6"
              }`}
            >
              <h2 className="text-3xl font-black mb-4 flex items-center">
                <span className="bg-green-400 px-3 py-1 border-2 border-black mr-2">
                  ✨
                </span>
                Our Solution
              </h2>
              <ul className="space-y-3 text-lg font-bold">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    NFT Fan Passes unlock premium content and voting power
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Automatic Protection Pool from pass sales percentage
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Transparent, on-chain governance and automatic payouts
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    AI-powered assistance makes everything human-friendly
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-blue-300 text-black px-6 py-3 border-4 border-black shadow-[6px_6px_0_0_#000] inline-block transform rotate-1">
                ✨ Key Features
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`${
                  feature.color
                } border-4 border-black p-6 shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all ${
                  mounted
                    ? `rotate-${index % 2 === 0 ? "1" : "-1"}`
                    : "rotate-0"
                }`}
              >
                <div className="mb-4 transform rotate-12">{feature.icon}</div>
                <h3 className="text-2xl font-black mb-3">{feature.title}</h3>
                <p className="font-bold text-black/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-6 py-16 bg-gray-100 border-t-4 border-b-4 border-black">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-yellow-300 text-black px-6 py-3 border-4 border-black shadow-[6px_6px_0_0_#000] inline-block transform -rotate-1">
                🔄 How It Works
              </span>
            </h2>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <div
                key={step.step}
                className={`flex items-start gap-6 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] transform transition-all duration-500 ${
                  mounted
                    ? `${index % 2 === 0 ? "rotate-1" : "-rotate-1"}`
                    : "rotate-0"
                }`}
              >
                <div className="bg-purple-400 text-black font-black text-3xl px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#000] transform rotate-12 shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-black">{step.icon}</div>
                    <h3 className="text-2xl font-black">{step.title}</h3>
                  </div>
                  <p className="text-lg font-bold text-black/80">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why It Matters */}
        <section className="container mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 border-4 border-black p-12 shadow-[10px_10px_0_0_#000] transform rotate-1">
            <div className="text-center mb-8">
              <Globe className="w-16 h-16 mx-auto mb-4 transform rotate-12" />
              <h2 className="text-5xl font-black mb-6">Why This Matters</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white border-3 border-black p-6 transform -rotate-1">
                <div className="text-4xl mb-3">💎</div>
                <h3 className="text-xl font-black mb-2">Own Your Access</h3>
                <p className="font-bold">
                  Fan Pass NFTs are yours to own, trade, and benefit from.
                  You&apos;re not just a subscriber—you&apos;re a stakeholder.
                </p>
              </div>

              <div className="bg-white border-3 border-black p-6 transform rotate-1">
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="text-xl font-black mb-2">Protect Creators</h3>
                <p className="font-bold">
                  Real protection for real setbacks. Transparent, fair, and
                  community-driven support when creators need it most.
                </p>
              </div>

              <div className="bg-white border-3 border-black p-6 transform -rotate-1">
                <div className="text-4xl mb-3">🌐</div>
                <h3 className="text-xl font-black mb-2">Web3 Native</h3>
                <p className="font-bold">
                  Built on Solana with Metaplex NFTs. Fast, cheap, transparent.
                  The future of creator-fan relationships.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="text-center">
            <div className="bg-cyan-300 border-4 border-black p-12 shadow-[10px_10px_0_0_#000] transform -rotate-1 max-w-3xl mx-auto">
              <h2 className="text-5xl font-black mb-6">
                Ready to Transform the Creator Economy?
              </h2>
              <p className="text-2xl font-bold mb-8">
                Join creators and fans building the future of mutual support
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/feed">
                  <Button
                    size="lg"
                    className="bg-purple-400 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold text-xl px-10 py-5 transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                  >
                    Start Exploring
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button
                    size="lg"
                    className="bg-yellow-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold text-xl px-10 py-5 transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                  >
                    Create Your Pass
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
