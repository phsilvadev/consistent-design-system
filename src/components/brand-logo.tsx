"use client";

import { useId } from "react";

type BrandLogoProps = { white?: boolean; className?: string };

export function BrandLogo({ white = false, className = "h-auto w-44" }: BrandLogoProps) {
  return (
    <img
      src={white ? "/atendehub-logo-white.png" : "/atendehub-logo.png"}
      alt="AtendeHUB"
      width={2172}
      height={724}
      className={className}
      style={
        white
          ? {
              maskImage: 'url("/atendehub-logo.png")',
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
            }
          : undefined
      }
    />
  );
}

export function BrandMark({ white = false, className = "h-10 w-10" }: BrandLogoProps) {
  const clipId = useId();
  return (
    <svg
      viewBox="200 100 490 540"
      role="img"
      aria-label="AtendeHUB"
      className={className}
      overflow="hidden"
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d="M200 100H690V285H600V640H200Z" />
        </clipPath>
      </defs>
      <image
        clipPath={`url(#${clipId})`}
        href={white ? "/atendehub-logo-white.png" : "/atendehub-logo.png"}
        width={2172}
        height={724}
      />
    </svg>
  );
}
