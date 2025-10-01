"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Plus, TrendingUp, Sparkles } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  subscribers: number;
  description?: string;
  category?: string;
}

interface TrendingTopic {
  tag: string;
  posts: string;
  growth?: string;
}

interface RightSidebarProps {
  creators: Creator[];
  trendingTopics?: TrendingTopic[];
  className?: string;
  showTrending?: boolean;
  maxCreators?: number;
}

export function RightSidebar({
  creators,
  trendingTopics = [],
  className = "",
  showTrending = true,
  maxCreators = 5,
}: RightSidebarProps) {
  const formatSubscriberCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  const displayedCreators = creators.slice(0, maxCreators);

  return (
    <div
      className={`w-80 h-screen sticky top-0 bg-white border-l-4 border-black p-6 overflow-y-auto ${className}`}
    >
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="font-extrabold text-xl mb-2">
            <span className="bg-pink-300 text-black px-3 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] inline-block transform -rotate-1">
              <Users className="inline-block w-5 h-5 mr-2" />
              TOP CREATORS
            </span>
          </h2>
          <p className="text-black font-bold text-sm mt-3">
            Follow the most popular creators
          </p>
        </div>

        <div className="space-y-4">
          {displayedCreators.map((creator, index) => (
            <div
              key={creator.id}
              className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-4 hover:shadow-[8px_8px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-3 border-black shadow-[3px_3px_0_0_#000]">
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback className="bg-cyan-300 text-black font-extrabold text-lg">
                        {creator.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="absolute -top-2 -right-2 bg-yellow-300 text-black text-xs font-extrabold px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] transform rotate-12">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <Link href={`/profile/${creator.username}`}>
                        <h3 className="font-extrabold text-black truncate hover:underline text-sm">
                          {creator.name}
                        </h3>
                      </Link>
                      {creator.verified && (
                        <div className="w-4 h-4 bg-green-400 border-2 border-black rotate-12 flex items-center justify-center shadow-[1px_1px_0_0_#000]">
                          <svg
                            className="w-2 h-2 text-black"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-bold text-gray-600 mb-1">
                      @{creator.username}
                    </div>

                    {creator.category && (
                      <div className="inline-block bg-gray-100 text-black text-xs font-bold px-2 py-1 border-2 border-black transform -rotate-1 mb-2">
                        {creator.category}
                      </div>
                    )}

                    <div className="flex items-center space-x-1 mb-2">
                      <Users className="w-3 h-3 text-black" />
                      <span className="text-xs font-extrabold text-black">
                        {formatSubscriberCount(creator.subscribers)} subscribers
                      </span>
                    </div>

                    {creator.description && (
                      <p className="text-xs font-medium text-gray-700 line-clamp-2 mb-2">
                        {creator.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full bg-cyan-300 text-black border-3 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] font-extrabold text-xs transform hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-3 h-3 mr-1" />
                FOLLOW
              </Button>
            </div>
          ))}
        </div>

        {creators.length > maxCreators && (
          <div className="mt-4">
            <Link href="/creators">
              <Button
                variant="outline"
                className="w-full bg-white text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] font-extrabold transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
              >
                VIEW ALL CREATORS
              </Button>
            </Link>
          </div>
        )}
      </div>

      {showTrending && trendingTopics.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="font-extrabold text-lg mb-2">
              <span className="bg-yellow-300 text-black px-3 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] inline-block transform rotate-1">
                <TrendingUp className="inline-block w-4 h-4 mr-2" />
                TRENDING
              </span>
            </h3>
          </div>

          <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-4">
            <div className="space-y-3">
              {trendingTopics.map((topic) => (
                <Link key={topic.tag} href={`/topics/${topic.tag.slice(1)}`}>
                  <div className="p-3 border-2 border-black hover:bg-gray-50 transform hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-black group-hover:underline">
                          {topic.tag}
                        </div>
                        <div className="text-xs font-bold text-gray-600">
                          {topic.posts}
                        </div>
                      </div>

                      {topic.growth && (
                        <div className="flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-pink-500" />
                          <span className="text-xs font-extrabold text-pink-500">
                            +{topic.growth}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      <div className="mt-auto">
        <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-4">
          <h4 className="font-extrabold text-sm mb-3 bg-pink-300 text-black px-2 py-1 border-2 border-black inline-block transform -rotate-1">
            QUICK ACTIONS
          </h4>

          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full bg-yellow-300 text-black border-3 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] font-extrabold text-xs transform hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-3 h-3 mr-1" />
              CREATE POST
            </Button>

            <Link href="/explore">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white text-black border-3 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] font-extrabold text-xs transform hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                EXPLORE MORE
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default props
RightSidebar.defaultProps = {
  trendingTopics: [
    { tag: "#SolanaHacks", posts: "12.5K posts", growth: "15%" },
    { tag: "#Web3Social", posts: "8.2K posts", growth: "8%" },
    { tag: "#DecentralizedSocial", posts: "5.1K posts", growth: "23%" },
  ],
  showTrending: true,
  maxCreators: 5,
};
