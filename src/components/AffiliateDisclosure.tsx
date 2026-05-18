import { Info } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface AffiliateDisclosureProps {
  variant?: "inline" | "banner" | "footer";
}

/**
 * FTC-compliant affiliate disclosure (16 CFR Part 255).
 * Must appear "clearly and conspicuously" near affiliate link clusters.
 */
const AffiliateDisclosure = ({ variant = "inline" }: AffiliateDisclosureProps) => {
  if (variant === "banner") {
    return (
      <div className="glass rounded-xl border border-primary/20 px-4 py-3 flex items-start gap-3 text-xs md:text-sm">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Affiliate disclosure:</span>{" "}
          As an Amazon Associate, GearUpToFit earns from qualifying purchases.
          Some links on this page are affiliate links — we may earn a small
          commission if you buy through them, at no extra cost to you. Prices
          and availability shown on Amazon are live and may differ from the
          MSRP shown here.
        </p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold">Affiliate disclosure:</span>{" "}
          As an Amazon Associate, GearUpToFit earns from qualifying purchases.
          Some links are affiliate links — at no extra cost to you. We never
          recommend a watch based on commission; rankings are produced by our{" "}
          <Link to="/methodology" className="underline hover:text-primary">
            deterministic scoring engine
          </Link>
          .
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          <Link to="/affiliate-disclosure" className="underline hover:text-primary">
            Full disclosure
          </Link>
          <span className="px-1.5">·</span>
          <Link to="/methodology" className="underline hover:text-primary">
            Methodology
          </Link>
          <span className="px-1.5">·</span>
          <a
            href="https://gearuptofit.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Privacy
          </a>
        </p>
      </div>
    );
  }

  return (
    <p className="text-[10px] text-muted-foreground leading-snug flex items-center gap-1">
      <Info className="w-3 h-3 flex-shrink-0" />
      Affiliate link — we may earn a commission at no cost to you.
    </p>
  );
};

export default AffiliateDisclosure;