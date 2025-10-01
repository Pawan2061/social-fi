import { Sidebar } from "@/components/feed/side-bar";
import { RightSidebar } from "@/components/feed/right-side-bar";
import { BrutalGrid, NoiseOverlay } from "@/components/ui/backgrounds";

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const popularCreators = [
    {
      id: "1",
      name: "Crypto Sarah",
      username: "cryptosarah",
      avatar: "/api/placeholder/40/40",
      verified: true,
      subscribers: 125000,
      description:
        "Blockchain developer & educator sharing Web3 insights daily 🚀",
      category: "Tech",
    },
    {
      id: "2",
      name: "DeFi Mike",
      username: "defimike",
      verified: true,
      subscribers: 89000,
      description: "DeFi protocols expert. Building the future of finance ⚡",
      category: "Finance",
    },
    {
      id: "3",
      name: "NFT Artist Luna",
      username: "nftluna",
      verified: false,
      subscribers: 67000,
      description: "Digital artist creating unique NFT collections 🎨",
      category: "Art",
    },
    {
      id: "4",
      name: "Solana Dev",
      username: "solanadev",
      verified: true,
      subscribers: 156000,
      description:
        "Core Solana developer. Rust tutorials and ecosystem updates 🦀",
      category: "Development",
    },
    {
      id: "5",
      name: "Web3 News",
      username: "web3news",
      verified: true,
      subscribers: 203000,
      description: "Daily Web3 news and market analysis. Stay informed! 📰",
      category: "News",
    },
  ];
  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <BrutalGrid />
      <NoiseOverlay />

      <div className="flex h-full relative z-10">
        {/* Left Sidebar - Fixed */}
        <div className="hidden lg:block h-full">
          <Sidebar
            user={{
              name: "John Doe",
              username: "johndoe",
              avatar: "/api/placeholder/40/40",
              verified: true,
            }}
          />
        </div>

        <div className="flex-1 h-full flex flex-col">
          {/* Mobile Header - Fixed */}
          <div className="lg:hidden flex-shrink-0">
            <div className="bg-white border-b-4 border-black p-4">
              <div className="flex items-center justify-between">
                <div className="bg-yellow-300 text-black px-3 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] font-extrabold text-lg transform -rotate-1">
                  <span className="inline-block transform rotate-1">
                    SOCIAL
                  </span>
                </div>

                {/* Mobile menu button - for future implementation */}
                <button className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] p-3 font-extrabold transform hover:-translate-x-1 hover:-translate-y-1 transition-all">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Center Content - Scrollable */}
          <div className="flex-1 flex overflow-hidden">
            {/* Scrollable Feed Content */}
            <main className="flex-1 overflow-y-auto">{children}</main>

            {/* Right Sidebar - Fixed */}
            <div className="hidden xl:block h-full overflow-y-auto">
              <RightSidebar
                creators={popularCreators}
                maxCreators={5}
                showTrending={true}
              />
            </div>
          </div>

          {/* Mobile Bottom Navigation - Fixed */}
          <div className="lg:hidden flex-shrink-0 bg-white border-t-4 border-black p-4">
            <div className="flex justify-around items-center">
              {[
                {
                  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                  label: "Home",
                },
                {
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  label: "Search",
                },
                {
                  icon: "M15 17h5l-5 5v-5zM10.5 9A1.5 1.5 0 109 7.5v5a1.5 1.5 0 001.5 1.5h5a1.5 1.5 0 001.5-1.5v-5A1.5 1.5 0 0015.5 6h-5z",
                  label: "Create",
                },
                { icon: "M15 17h5l-5 5v-5z", label: "Notifications" },
                {
                  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                  label: "Profile",
                },
              ].map((item, index) => (
                <button
                  key={index}
                  className="bg-white border-3 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] p-3 transform hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
