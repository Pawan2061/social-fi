"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Users } from 'lucide-react';

export type PostFilter = 'all' | 'widgets';

interface PostFilterToggleProps {
    activeFilter: PostFilter;
    onFilterChange: (filter: PostFilter) => void;
    className?: string;
    showCounts?: boolean;
    allCount?: number;
    premiumCount?: number;
    onHoverWidgets?: () => void;
}

export function PostFilterToggle({
    activeFilter,
    onFilterChange,
    className = "",
    showCounts = false,
    allCount = 0,
    premiumCount = 0,
    onHoverWidgets
}: PostFilterToggleProps) {

    const filters = [
        {
            id: 'all' as PostFilter,
            label: 'All Posts',
            icon: Users,
            count: allCount,
            description: 'See all posts from your network'
        },
        {
            id: 'widgets' as PostFilter,
            label: 'Widgets',
            icon: Crown,
            count: premiumCount,
            description: 'Discover user-created widgets'
        }
    ];

    return (
        <div className={`bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg">
                    <span className="bg-cyan-300 text-black px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] inline-block transform -rotate-1">
                        FILTER POSTS
                    </span>
                </h3>

                {showCounts && (
                    <div className="text-xs font-bold text-gray-600">
                        {activeFilter === 'all' ? `${allCount} posts` : `${premiumCount} widgets`}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                {filters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;

                    return (
                        <Button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            onMouseEnter={() => {
                                if (filter.id === 'widgets') onHoverWidgets?.();
                            }}
                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-extrabold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all ${isActive
                                ? filter.id === 'widgets'
                                    ? 'bg-yellow-300 text-black'
                                    : 'bg-pink-300 text-black'
                                : 'bg-white text-black hover:bg-gray-50'
                                }`}
                            title={filter.description}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm">{filter.label}</span>

                            {showCounts && filter.count > 0 && (
                                <div className={`px-2 py-1 text-xs font-extrabold border-2 border-black shadow-[1px_1px_0_0_#000] transform rotate-12 ${isActive
                                    ? 'bg-white text-black'
                                    : filter.id === 'widgets'
                                        ? 'bg-yellow-300 text-black'
                                        : 'bg-cyan-300 text-black'
                                    }`}>
                                    {filter.count}
                                </div>
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Active filter description */}
            <div className="mt-3 text-xs font-bold text-gray-600 text-center">
                {filters.find(f => f.id === activeFilter)?.description}
            </div>
        </div>
    );
}
