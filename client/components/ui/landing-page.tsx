"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import OnboardingModal from "@/components/modals/onboarding-modal";

interface ScrollGlobeProps {
  sections: {
    id: string;
    badge?: string;
    title: string;
    subtitle?: string;
    description: string;
    align?: "left" | "center" | "right";
    features?: { title: string; description: string }[];
    actions?: {
      label: string;
      variant: "primary" | "secondary";
      onClick?: () => void;
    }[];
  }[];
  className?: string;
}

function ScrollGlobe({ sections, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);

  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);

    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    setActiveSection(newActiveSection);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      const frameId = animationFrameId.current;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [updateScrollPosition]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen text-foreground",
        className
      )}
    >
      <div className="fixed top-0 left-0 w-full h-2 bg-border z-50">
        <div
          className="h-full bg-foreground will-change-transform"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: "left center",
            transition: "transform 0.12s steps(8, end)",
          }}
        />
      </div>

      <div className="hidden sm:flex fixed right-3 sm:right-5 lg:right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              <div
                className={cn(
                  "absolute right-6 lg:right-8 top-1/2 -translate-y-1/2",
                  "px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-sm text-xs sm:text-sm font-semibold whitespace-nowrap",
                  "bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#000]",
                  activeSection === index ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="text-xs sm:text-sm lg:text-base">
                  {section.badge || `Section ${index + 1}`}
                </span>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={cn(
                  "relative w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 transition-transform",
                  activeSection === index
                    ? "bg-foreground scale-110"
                    : "bg-white border-2 border-foreground scale-100",
                  "shadow-[3px_3px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 will-change-transform"
                )}
                aria-current={activeSection === index ? "step" : undefined}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>
      </div>

      {sections.map((section, index) => (
        <section
          id={section.id}
          key={section.id}
          ref={(el) => {
            sectionRefs.current[index] = el as HTMLDivElement | null;
          }}
          className={cn(
            "relative scroll-mt-24 min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 z-20 py-12 sm:py-16 lg:py-20",
            section.align === "center" && "items-center text-center",
            section.align === "right" && "items-end text-right",
            (!section.align || section.align === "left") &&
              "items-start text-left",
            "transition-all duration-500 ease-out transform-gpu",
            activeSection === index
              ? "opacity-100 translate-y-0"
              : "opacity-95 translate-y-1"
          )}
        >
          {index === 0 && (
            <>
              <div className="pointer-events-none absolute -z-10 top-6 left-6 w-20 h-20 sm:w-24 sm:h-24 bg-white border-4 border-foreground shadow-[8px_8px_0_0_#000] rotate-6 opacity-90" />
              <div className="pointer-events-none absolute -z-10 bottom-10 right-8 w-16 h-16 sm:w-20 sm:h-20 bg-yellow-300 border-4 border-foreground shadow-[8px_8px_0_0_#000] -rotate-3" />
              <div className="pointer-events-none absolute -z-10 top-1/3 right-1/3 w-8 h-8 bg-cyan-300 border-4 border-foreground shadow-[6px_6px_0_0_#000]" />
            </>
          )}
          <div className="w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            {/* Title block */}
            <div className="inline-block bg-white text-foreground border-4 border-foreground px-3 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6 shadow-[6px_6px_0_0_#000]">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                {section.badge || "Section"}
              </span>
            </div>

            <h1
              className={cn(
                "font-extrabold mb-6 sm:mb-8 leading-[1.06]",
                index === 0
                  ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                  : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
              )}
            >
              <span className="bg-yellow-300 text-black px-2 sm:px-3 inline-block border-4 border-foreground shadow-[6px_6px_0_0_#000]">
                {section.title}
              </span>
              {section.subtitle && (
                <span className="ml-2 sm:ml-3 bg-cyan-300 text-black px-2 sm:px-3 inline-block border-4 border-foreground shadow-[6px_6px_0_0_#000]">
                  {section.subtitle}
                </span>
              )}
            </h1>

            <div
              className={cn(
                "mb-8 sm:mb-10 text-base sm:text-lg lg:text-xl",
                section.align === "center" ? "max-w-3xl mx-auto" : "max-w-3xl"
              )}
            >
              <div className="bg-white text-foreground border-4 border-foreground p-4 sm:p-5 shadow-[8px_8px_0_0_#000]">
                <p className="leading-relaxed">{section.description}</p>
              </div>
            </div>

            {section.features && (
              <div className="grid gap-4 sm:gap-5 mb-8 sm:mb-10">
                {section.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group border-4 border-foreground bg-white p-4 sm:p-5 shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-transform"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-3 h-3 bg-pink-300 border-2 border-foreground shadow-[3px_3px_0_0_#000]" />
                      <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                        <h3 className="font-extrabold text-lg sm:text-xl text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-foreground/80 text-sm sm:text-base">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.actions && (
              <div
                className={cn(
                  "flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4",
                  section.align === "center" && "justify-center",
                  section.align === "right" && "justify-end",
                  (!section.align || section.align === "left") &&
                    "justify-start"
                )}
              >
                {section.actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "relative px-6 sm:px-8 py-3 sm:py-4 font-extrabold",
                      "border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform will-change-transform",
                      action.variant === "primary"
                        ? "bg-yellow-300 text-black"
                        : "bg-white text-foreground"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function CreatorInsuranceLanding() {
  const { connected } = useWallet();
  const { token, user } = useAuth();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [userType, setUserType] = useState<"creator" | "fan">("fan");

  const handleGetStarted = (type: "creator" | "fan") => {
    if (!connected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!token) {
      alert("Authenticating... Please wait and try again.");
      return;
    }

    if (user?.onboarded) {
      window.location.href = "/feed";
    } else {
      setUserType(type);
      setShowOnboardingModal(true);
    }
  };

  const sections = [
    {
      id: "hero",
      badge: "Welcome",
      title: "Creator Insurance",
      subtitle: "DAO",
      description:
        "Empower creators with real financial protection. Fans buy NFT passes, creators get protected. When setbacks happen, the community votes and pays out—all transparent, all on-chain. It's Patreon meets mutual insurance, powered by Web3.",
      align: "center" as const,
      actions: [
        {
          label: "Start as Creator",
          variant: "primary" as const,
          onClick: () => handleGetStarted("creator"),
        },
        {
          label: "Join as Fan",
          variant: "secondary" as const,
          onClick: () => handleGetStarted("fan"),
        },
      ],
    },
    {
      id: "problem",
      badge: "Problem",
      title: "Creators Face Financial Fragility",
      description:
        "Unpredictable income, no safety net, and shallow fan support leave creators vulnerable to bans, demonetization, and equipment failures that can wipe out revenue overnight.",
      align: "center" as const,
    },
    {
      id: "solution",
      badge: "Solution",
      title: "Web3 Protection",
      subtitle: "Network",
      description:
        "Our platform combines the best of Patreon, TikTok, and mutual insurance through Web3 technology. Fans become true backers while creators get the protection they deserve.",
      align: "left" as const,
      features: [
        {
          title: "Fan Pass NFTs",
          description:
            "Tradable access passes that unlock exclusive content and provide voting power",
        },
        {
          title: "AI-Powered Assistance",
          description:
            "Smart claim summaries, translations, and plain-English insights for everyone",
        },
        {
          title: "Transparent Governance",
          description:
            "Community-driven decisions with on-chain voting and automatic payouts",
        },
      ],
    },
    {
      id: "future",
      badge: "Future",
      title: "Transform Creator",
      subtitle: "Economy",
      description:
        "Join the revolution where fans become true backers and creators get the protection they deserve. Built on Solana with Metaplex NFTs for fast, cheap, and transparent transactions.",
      align: "center" as const,
      actions: [{ label: "Explore more", variant: "primary" as const }],
    },
  ];

  return (
    <>
      <ScrollGlobe sections={sections} className="" />
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        userType={userType}
      />
    </>
  );
}
