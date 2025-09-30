"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share,
    MoreHorizontal,
    Bookmark
} from 'lucide-react';

interface PostCardProps {
    id: string;
    author: {
        name: string;
        username: string;
        avatar?: string;
        verified?: boolean;
    };
    content: string;
    timestamp: string;
    initialLikes?: number;
    initialRetweets?: number;
    initialComments?: number;
    image?: string;
}

export function PostCard({
    id,
    author,
    content,
    timestamp,
    initialLikes = 0,
    initialRetweets = 0,
    initialComments = 0,
    image
}: PostCardProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [retweets, setRetweets] = useState(initialRetweets);
    const [isLiked, setIsLiked] = useState(false);
    const [isRetweeted, setIsRetweeted] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const handleLike = () => {
        if (isLiked) {
            setLikes(likes - 1);
            setIsLiked(false);
        } else {
            setLikes(likes + 1);
            setIsLiked(true);
        }
    };

    const handleRetweet = () => {
        if (isRetweeted) {
            setRetweets(retweets - 1);
            setIsRetweeted(false);
        } else {
            setRetweets(retweets + 1);
            setIsRetweeted(true);
        }
    };

    const handleComment = () => {
        // Handle comment action
        console.log('Comment clicked');
    };

    const handleShare = () => {
        // Handle share action
        if (navigator.share) {
            navigator.share({
                title: `${author.name} on Social`,
                text: content,
                url: window.location.href + '/post/' + id,
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(window.location.href + '/post/' + id);
        }
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200 cursor-pointer transform hover:-translate-x-1 hover:-translate-y-1">
            <CardHeader className="pb-3 bg-white border-b-4 border-black">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <Avatar className="w-12 h-12 border-3 border-black shadow-[4px_4px_0px_0px_#000]">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback className="bg-cyan-400 text-black font-black text-lg border-3 border-black">
                                {author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-black text-black truncate hover:underline text-lg tracking-tight">
                                    {author.name}
                                </h3>
                                {author.verified && (
                                    <div className="w-6 h-6 bg-green-400 border-2 border-black rotate-12 flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                                        <svg className="w-3 h-3 text-black font-black" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-black font-bold truncate">@{author.username}</span>
                                <span className="text-black font-bold">•</span>
                                <span className="text-black font-bold text-sm bg-yellow-300 px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] transform -rotate-1">{timestamp}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 h-10 w-10 border-3 border-black bg-red-400 hover:bg-red-500 shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1">
                        <MoreHorizontal className="h-5 w-5 text-black font-black" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-4 bg-white">
                <div className="space-y-4">
                    <p className="text-black text-base leading-relaxed whitespace-pre-wrap font-bold tracking-tight">
                        {content}
                    </p>

                    {image && (
                        <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] transform rotate-1 hover:rotate-0 transition-transform">
                            <Image
                                src={image}
                                alt="Post image"
                                width={600}
                                height={300}
                                className="w-full max-h-96 object-cover"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t-4 border-black bg-white p-3 -mx-6 -mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-2 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] p-3 h-auto font-extrabold text-black hover:-translate-x-1 hover:-translate-y-1 transition-all"
                            onClick={handleComment}
                        >
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-sm font-extrabold">{initialComments > 0 ? formatNumber(initialComments) : '0'}</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center space-x-2 p-3 h-auto font-extrabold border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all ${isRetweeted
                                ? 'bg-cyan-300 text-black'
                                : 'bg-white text-black hover:bg-cyan-300'
                                }`}
                            onClick={handleRetweet}
                        >
                            <Repeat2 className="h-5 w-5" />
                            <span className="text-sm font-extrabold">{retweets > 0 ? formatNumber(retweets) : '0'}</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center space-x-2 p-3 h-auto font-extrabold border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all ${isLiked
                                ? 'bg-pink-300 text-black'
                                : 'bg-white text-black hover:bg-pink-300'
                                }`}
                            onClick={handleLike}
                        >
                            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm font-extrabold">{likes > 0 ? formatNumber(likes) : '0'}</span>
                        </Button>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`p-3 h-auto font-extrabold border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all ${isBookmarked
                                    ? 'bg-yellow-300 text-black'
                                    : 'bg-white text-black hover:bg-yellow-300'
                                    }`}
                                onClick={handleBookmark}
                            >
                                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white text-black hover:bg-gray-100 font-extrabold border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] p-3 h-auto transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                                onClick={handleShare}
                            >
                                <Share className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Example usage with sample data
export function SamplePostCard() {
    return (
        <PostCard
            id="1"
            author={{
                name: "John Doe",
                username: "johndoe",
                avatar: "/api/placeholder/40/40",
                verified: true
            }}
            content="Just shipped a new feature! 🚀 Really excited to see what the community builds with this. The possibilities are endless when you combine creativity with great tools. #BuildInPublic #TechLife"
            timestamp="2h"
            initialLikes={42}
            initialRetweets={12}
            initialComments={5}
            image="/api/placeholder/600/300"
        />
    );
}
