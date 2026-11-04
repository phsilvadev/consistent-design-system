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
