"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share,
    Bookmark,
    Crown,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Volume2,
    VolumeX
} from 'lucide-react'; interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string; // For video thumbnails
    alt?: string;
    aspectRatio?: 'square' | 'landscape' | 'portrait';
}

interface PostCardProps {
    id: string;
    author: {
        id: string;
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
    image?: string; // Keep for backward compatibility
    media?: MediaItem[]; // New media array
    isPremium?: boolean;
    isOwner?: boolean;
    onDelete?: (id: string) => void;
}

export function PostCard({
    id,
    author,
    content,
    timestamp,
    initialLikes = 0,
    initialRetweets = 0,
    initialComments = 0,
    image,
    media = [],
    isPremium = false,
    isOwner = false,
    onDelete
}: PostCardProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [retweets, setRetweets] = useState(initialRetweets);
    const [isLiked, setIsLiked] = useState(false);
    const [isRetweeted, setIsRetweeted] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Media gallery state
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [videoPlaying, setVideoPlaying] = useState<Record<string, boolean>>({});
    const [videoMuted, setVideoMuted] = useState<Record<string, boolean>>({});

    // Video refs for each video (using Map to handle multiple videos)
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    // Determine media to show (new media array or fallback to single image)
    const displayMedia = media.length > 0 ? media : (image ? [{
        id: '1',
        type: 'image' as const,
        url: image,
        alt: 'Post image'
    }] : []);

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
        console.log('Comment clicked');
    };

    const handleShare = () => {
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

    // Media navigation handlers
    const nextMedia = () => {
        setCurrentMediaIndex((prev) =>
            prev === displayMedia.length - 1 ? 0 : prev + 1
        );
    };

    const previousMedia = () => {
        setCurrentMediaIndex((prev) =>
            prev === 0 ? displayMedia.length - 1 : prev - 1
        );
    };

    const toggleVideoPlay = async (mediaId: string) => {
        const videoElement = videoRefs.current.get(mediaId);
        if (videoElement) {
            try {
                if (videoPlaying[mediaId]) {
                    videoElement.pause();
                    setVideoPlaying(prev => ({ ...prev, [mediaId]: false }));
                } else {
                    await videoElement.play();
                    setVideoPlaying(prev => ({ ...prev, [mediaId]: true }));
                }
            } catch (error) {
                console.error('Error toggling video play:', error);
            }
        }
    };

    const toggleVideoMute = (mediaId: string) => {
        const videoElement = videoRefs.current.get(mediaId);
        if (videoElement) {
            const newMutedState = !videoMuted[mediaId];
            videoElement.muted = newMutedState;
            setVideoMuted(prev => ({
                ...prev,
                [mediaId]: newMutedState
            }));
        }
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
                                <Link href={`/profile/${author.id}`} className="hover:underline">
                                    <h3 className="font-black text-black truncate text-lg tracking-tight">
                                        {author.name}
                                    </h3>
                                </Link>
                                {author.verified && (
                                    <div className="w-6 h-6 bg-green-400 border-2 border-black rotate-12 flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                                        <svg className="w-3 h-3 text-black font-black" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                                {isPremium && (
                                    <div className="bg-yellow-300 text-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] transform -rotate-6 flex items-center space-x-1">
                                        <Crown className="w-3 h-3" />
                                        <span className="text-xs font-extrabold">PREMIUM</span>
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
                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 h-10 border-3 border-black bg-yellow-300 hover:bg-yellow-400 shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!onDelete) return;
                                    const confirmed = window.confirm('Delete this post? This cannot be undone.');
                                    if (confirmed) onDelete(id);
                                }}
                            >
                                Delete
                            </Button>
                        )}

                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 bg-white">
                <div className="space-y-4">
                    <p className="text-black text-base leading-relaxed whitespace-pre-wrap font-bold tracking-tight">
                        {content}
                    </p>

                    {displayMedia.length > 0 && (
                        <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] transform rotate-1 hover:rotate-0 transition-transform relative">
                            {/* Media Container */}
                            <div className="relative overflow-hidden bg-black">
                                {/* Current Media Item */}
                                {displayMedia.map((mediaItem, index) => (
                                    <div
                                        key={mediaItem.id}
                                        className={`transition-transform duration-300 ease-in-out ${index === currentMediaIndex ? 'block' : 'hidden'
                                            }`}
                                    >
                                        {mediaItem.type === 'image' ? (
                                            <Image
                                                loading='lazy'
                                                src={mediaItem.url}
                                                alt={mediaItem.alt || 'Post media'}
                                                width={600}
                                                height={300}
                                                className="w-full max-h-96 object-cover"
                                            />
                                        ) : (
                                            <div className="relative w-full h-64 bg-black border-4 border-black shadow-[6px_6px_0_0_#000]">
                                                <video
                                                    ref={(el) => {
                                                        if (el) {
                                                            videoRefs.current.set(mediaItem.id, el);
                                                        }
                                                    }}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    controls={false}
                                                    muted={videoMuted[mediaItem.id] !== false} // Default to muted
                                                    loop
                                                    playsInline
                                                    poster={mediaItem.thumbnail}
                                                    onClick={() => toggleVideoPlay(mediaItem.id)}
                                                    onLoadedMetadata={() => console.log('Video metadata loaded:', mediaItem.url)}
                                                    onError={(e) => console.error('Video failed to load:', mediaItem.url, e)}
                                                    onLoadStart={() => console.log('Video load started:', mediaItem.url)}
                                                    onPlay={() => setVideoPlaying(prev => ({ ...prev, [mediaItem.id]: true }))}
                                                    onPause={() => setVideoPlaying(prev => ({ ...prev, [mediaItem.id]: false }))}
                                                >
                                                    <source src={mediaItem.url} type="video/mp4" />
                                                    <source src={mediaItem.url} type="video/webm" />
                                                    Your browser does not support the video tag.
                                                </video>

                                                {/* Video Controls Overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                    <div className="text-center">
                                                        {/* Show thumbnail when video is not playing */}
                                                        {!videoPlaying[mediaItem.id] && mediaItem.thumbnail && (
                                                            <Image
                                                                width={600}
                                                                height={300}
                                                                src={mediaItem.thumbnail}
                                                                alt="Video thumbnail"
                                                                className="absolute inset-0 w-full h-full object-cover -z-10"
                                                                onError={() => console.error('Thumbnail failed to load:', mediaItem.thumbnail)}
                                                            />
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleVideoPlay(mediaItem.id);
                                                            }}
                                                            className="bg-black/70 hover:bg-black/90 text-white p-4 rounded-full border-2 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.3)] transition-all transform hover:scale-110 relative z-10"
                                                            aria-label={videoPlaying[mediaItem.id] ? "Pause video" : "Play video"}
                                                        >
                                                            {videoPlaying[mediaItem.id] ? (
                                                                <Pause className="w-8 h-8" />
                                                            ) : (
                                                                <Play className="w-8 h-8 ml-1" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Mute Button - always show for better UX */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleVideoMute(mediaItem.id);
                                                    }}
                                                    className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full border-2 border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.3)] transition-all z-20"
                                                    aria-label={videoMuted[mediaItem.id] !== false ? "Unmute video" : "Mute video"}
                                                >
                                                    {videoMuted[mediaItem.id] !== false ? (
                                                        <VolumeX className="w-4 h-4" />
                                                    ) : (
                                                        <Volume2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Navigation Arrows (only show if multiple media) */}
                                {displayMedia.length > 1 && (
                                    <>
                                        <Button
                                            onClick={previousMedia}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 border-3 border-white shadow-[3px_3px_0_0_#000] p-2 hover:bg-black/90"
                                            size="sm"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-white" />
                                        </Button>

                                        <Button
                                            onClick={nextMedia}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 border-3 border-white shadow-[3px_3px_0_0_#000] p-2 hover:bg-black/90"
                                            size="sm"
                                        >
                                            <ChevronRight className="w-5 h-5 text-white" />
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Media Indicators/Dots (only show if multiple media) */}
                            {displayMedia.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                                    {displayMedia.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentMediaIndex(index)}
                                            className={`w-3 h-3 border-2 border-white shadow-[2px_2px_0_0_#000] transition-all transform hover:scale-110 ${index === currentMediaIndex
                                                ? 'bg-yellow-300'
                                                : 'bg-white/50 hover:bg-white/70'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Media Counter (only show if multiple media) */}
                            {displayMedia.length > 1 && (
                                <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 border-2 border-white font-extrabold text-sm shadow-[2px_2px_0_0_#000]">
                                    {currentMediaIndex + 1} / {displayMedia.length}
                                </div>
                            )}
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
                id: "user1",
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
