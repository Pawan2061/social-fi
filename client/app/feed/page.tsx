import { PostCard } from '@/components/feed/post-card';

export default function FeedPage() {
    const samplePosts = [
        {
            id: "1",
            author: {
                name: "Sarah Chen",
                username: "sarahchen",
                verified: true
            },
            content: "Just deployed my first smart contract on Solana! 🚀 The developer experience is incredible. Can't wait to build more decentralized applications. #Solana #Web3 #BuildInPublic",
            timestamp: "2h",
            initialLikes: 127,
            initialRetweets: 23,
            initialComments: 15
        },
        {
            id: "2",
            author: {
                name: "Alex Rodriguez",
                username: "alexr_dev",
                verified: false
            },
            content: "Hot take: The future of social media is decentralized. No more platform lock-in, true ownership of content, and transparent algorithms. We're building that future today! 🌐✨",
            timestamp: "4h",
            initialLikes: 89,
            initialRetweets: 34,
            initialComments: 8
        },
        {
            id: "3",
            author: {
                name: "Tech Weekly",
                username: "techweekly",
                verified: true
            },
            content: "THREAD: 10 reasons why decentralized social networks will dominate in 2024 🧵\n\n1/ User ownership and control\n2/ Censorship resistance\n3/ Transparent algorithms\n4/ Creator monetization\n\nWhat do you think? Are we ready for the transition?",
            timestamp: "6h",
            initialLikes: 456,
            initialRetweets: 178,
            initialComments: 92
        },
        {
            id: "4",
            author: {
                name: "Maria Santos",
                username: "mariasantos",
                verified: false
            },
            content: "GM everyone! ☀️ Working on something exciting in the social-fi space. Can't share details yet but it's going to be game-changing for creators and their communities. Stay tuned! 👀",
            timestamp: "8h",
            initialLikes: 67,
            initialRetweets: 12,
            initialComments: 23
        }
    ];

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-8 px-4">
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 transform -rotate-1">
                    <h1 className="text-4xl font-black text-black mb-2 tracking-tight transform rotate-1">
                        <span className="bg-yellow-300 text-black px-3 py-1 border-4 border-black shadow-[4px_4px_0_0_#000] inline-block">
                            YOUR FEED
                        </span>
                    </h1>
                    <p className="text-black font-bold text-lg mt-4">Catch up with the latest from your network 🔥</p>
                </div>
            </div>

            <div className="space-y-6 px-4 pb-20 lg:pb-8">
                {samplePosts.map((post, index) => (
                    <div
                        key={post.id}
                        className={`transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform`}
                    >
                        <PostCard {...post} />
                    </div>
                ))}
            </div>
        </div>
    );
}