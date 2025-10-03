"use client";
import { PostCard } from "@/components/feed/post-card";
import {
  PostFilterToggle,
  PostFilter,
} from "@/components/ui/post-filter-toggle";
import { useState } from "react";

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState<PostFilter>("all");
  const allPosts = [
    {
      id: "1",
      author: {
        name: "Sarah Chen",
        username: "sarahchen",
        verified: true,
      },
      content:
        "Just deployed my first smart contract on Solana! 🚀 The developer experience is incredible. Can't wait to build more decentralized applications. #Solana #Web3 #BuildInPublic",
      timestamp: "2h",
      initialLikes: 127,
      initialRetweets: 23,
      initialComments: 15,
      isPremium: false,
      media: [
        {
          id: "1",
          type: "image" as const,
          url: "/api/placeholder/600/400",
          alt: "Solana smart contract code",
          aspectRatio: "landscape" as const
        },
        {
          id: "2",
          type: "image" as const,
          url: "/api/placeholder/600/400",
          alt: "Deployment success screen",
          aspectRatio: "landscape" as const
        },
        {
          id: "3",
          type: "video" as const,
          url: "/api/placeholder/video/demo.mp4",
          thumbnail: "/api/placeholder/600/400",
          alt: "Smart contract demo video",
          aspectRatio: "landscape" as const
        }
      ]
    },
    {
      id: "2",
      author: {
        name: "Alex Rodriguez",
        username: "alexr_dev",
        verified: false,
      },
      content:
        "Hot take: The future of social media is decentralized. No more platform lock-in, true ownership of content, and transparent algorithms. We're building that future today! 🌐✨",
      timestamp: "4h",
      initialLikes: 89,
      initialRetweets: 34,
      initialComments: 8,
      isPremium: false,
    },
    {
      id: "3",
      author: {
        name: "Tech Weekly",
        username: "techweekly",
        verified: true,
      },
      content:
        "🔒 PREMIUM INSIGHT: Deep dive into Solana's upcoming validator economics changes. Exclusive analysis shows 35% APY potential for early stakers. Full report with detailed tokenomics breakdown available to premium subscribers only. 📊💎",
      timestamp: "6h",
      initialLikes: 456,
      initialRetweets: 178,
      initialComments: 92,
      isPremium: true,
      media: [
        {
          id: "4",
          type: "video" as const,
          url: "/api/placeholder/video/analysis.mp4",
          thumbnail: "/api/placeholder/600/400",
          alt: "Solana validator economics analysis",
          aspectRatio: "landscape" as const
        },
        {
          id: "5",
          type: "image" as const,
          url: "/api/placeholder/600/400",
          alt: "APY projection charts",
          aspectRatio: "landscape" as const
        }
      ]
    },
    {
      id: "4",
      author: {
        name: "Maria Santos",
        username: "mariasantos",
        verified: false,
      },
      content:
        "GM everyone! ☀️ Working on something exciting in the social-fi space. Can't share details yet but it's going to be game-changing for creators and their communities. Stay tuned! 👀",
      timestamp: "8h",
      initialLikes: 67,
      initialRetweets: 12,
      initialComments: 23,
      isPremium: false,
    },
    {
      id: "5",
      author: {
        name: "Crypto Whale",
        username: "cryptowhale",
        verified: true,
      },
      content:
        "🔒 PREMIUM ALPHA: Just discovered a hidden gem in the Solana ecosystem. This project is flying under the radar but has backing from top-tier VCs. Premium members get the full research report + entry strategy. Not financial advice, but... 👀🚀",
      timestamp: "12h",
      initialLikes: 234,
      initialRetweets: 89,
      initialComments: 56,
      isPremium: true,
    },
  ];

  // Filter posts based on active filter
  const filteredPosts = allPosts.filter((post) => {
    if (activeFilter === "premium") {
      return post.isPremium;
    }
    return true; // 'all' shows both premium and regular posts
  });

  const premiumPostsCount = allPosts.filter((post) => post.isPremium).length;
  const allPostsCount = allPosts.length;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6 px-4">
        <PostFilterToggle
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showCounts={true}
          allCount={allPostsCount}
          premiumCount={premiumPostsCount}
          className="transform rotate-1"
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className={`transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"
                  } hover:rotate-0 transition-transform`}
              >
                <PostCard {...post} />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
                <h3 className="font-extrabold text-xl mb-2">
                  No {activeFilter === "premium" ? "Premium" : ""} Posts Found
                </h3>
                <p className="text-gray-600 font-bold">
                  {activeFilter === "premium"
                    ? "Subscribe to premium to access exclusive content!"
                    : "No posts available at the moment."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
