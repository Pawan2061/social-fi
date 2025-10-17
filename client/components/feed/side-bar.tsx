"use client";

import React, { useEffect, useState } from "react"; // added useEffect
import { createPortal } from "react-dom"; // added
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, Settings, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreatePostPopup from "@/components/feed/create-post-popup";
import CreateNewWidget from "@/components/widgets/create-new-widget";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  user?: {
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  className?: string;
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname();
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateChoice, setShowCreateChoice] = useState(false);
  const [showCreateWidget, setShowCreateWidget] = useState(false);

  // ensure portals only render on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const navigationItems: NavigationItem[] = [
    {
      name: "Home",
      href: "/feed",
      icon: Home,
    },
    {
      name: "Explore",
      href: "/explore",
      icon: Search,
      badge: 3,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      badge: 1,
    },

    {
      name: "Communities",
      href: "/communities",
      icon: Users,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/feed") {
      return pathname === "/feed" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`w-94 h-screen sticky top-0 bg-white border-r-4 border-black p-6 overflow-y-auto ${className}`}
    >
      <div className="mb-8">
        <Link href="/" className="block">
          <div className="bg-yellow-300 text-black px-4 py-3 border-4 border-black shadow-[6px_6px_0_0_#000] font-extrabold text-xl transform -rotate-1 hover:rotate-0 transition-transform">
            <span className="inline-block transform rotate-1">SOCIAL FI</span>
          </div>
        </Link>
      </div>

      <nav className="space-y-2 mb-8">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center justify-between p-3 border-4 border-black font-extrabold transition-all transform hover:-translate-x-1 hover:-translate-y-1 ${active
                  ? "bg-cyan-300 text-black shadow-[6px_6px_0_0_#000]"
                  : "bg-white text-black hover:bg-gray-50 shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-base">{item.name}</span>
                </div>
                {item.badge && (
                  <div className="bg-pink-300 text-black text-xs font-extrabold px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] transform rotate-12">
                    {item.badge}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mb-8">
        <Button
          onClick={() => setShowCreateChoice(true)}
          className="w-full bg-yellow-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold text-lg py-4 transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
        >
          <Plus className="h-5 w-5 mr-2" />
          CREATE NEW
        </Button>
      </div>
      <div className="mb-8">

      </div>

      {user && (
        <div className="mt-auto">
          <Link href="/profile">
            <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-4 hover:shadow-[8px_8px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 border-3 border-black shadow-[3px_3px_0_0_#000]">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-cyan-300 text-black font-extrabold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="font-extrabold text-sm truncate">
                      {user.name}
                    </span>
                    {user.verified && (
                      <div className="w-4 h-4 bg-green-400 border-2 border-black rotate-12 flex items-center justify-center">
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
                  <div className="text-xs font-bold text-gray-600 truncate">
                    @{user.username}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Choice modal */}
      {mounted && showCreateChoice &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/40"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowCreateChoice(false);
            }}
          >
            <div
              className="relative w-full max-w-sm bg-white border-4 border-black shadow-[12px_12px_0_0_#000] p-6 z-[2147483648]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black mb-4">What do you want to create?</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowCreateChoice(false);
                    setShowCreate(true);
                  }}
                  className="w-full bg-yellow-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold"
                >
                  Create Post
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateChoice(false);
                    setShowCreateWidget(true);
                  }}
                  className="w-full bg-pink-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] font-extrabold"
                >
                  Create Widget
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Create Widget modal wrapper */}
      {mounted && showCreateWidget &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/40"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowCreateWidget(false);
            }}
          >
            <div
              className="relative w-full max-w-2xl z-[2147483648]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <CreateNewWidget
                onCancel={() => setShowCreateWidget(false)}
                onCreated={() => setShowCreateWidget(false)}
              />
            </div>
          </div>,
          document.body
        )
      }

      {/* Create Post popup */}
      {mounted && showCreate && (
        <CreatePostPopup
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

Sidebar.defaultProps = {
  user: {
    name: "Guest User",
    username: "guest",
    verified: false,
  },
};
