import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/affiliate-disclosure")({
  head: () => ({
    meta: [
      { title: "Affiliate disclosure — WatchMatch AI" },
      {
        name: "description",
        content:
          "FTC-compliant affiliate disclosure for WatchMatch AI by GearUpToFit. How we earn, what it costs you, and how it stays separate from our recommendations.",
      },
      { rel: "canonical", href: "https://wrist-wonderland-hub.lovable.app/affiliate-disclosure" },
    ],
  }),
  component: AffiliateDisclosurePage,
});

function AffiliateDisclosurePage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-20">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-xs uppercase tracking-[0.22em] text-primary hover:underline">
          ← Back to WatchMatch
        </Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
          Affiliate disclosure
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: 2026-05-18
        </p>

        <div className="mt-8 space-y-5 text-sm md:text-base text-muted-foreground leading-relaxed">
          <p>
            WatchMatch AI is a free quiz and recommendation tool operated by{" "}
            <a
              href="https://gearuptofit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              GearUpToFit
            </a>
            . We participate in the Amazon Services LLC Associates Program, an
            affiliate advertising program designed to provide a means for sites
            to earn fees by linking to Amazon and affiliated sites.
          </p>
          <p>
            <strong className="text-foreground">As an Amazon Associate,
            GearUpToFit earns from qualifying purchases.</strong> When you
            click an "Buy on Amazon" button on this site and complete a
            purchase within the same session, Amazon may pay us a small
            commission. This is at <strong>no extra cost to you</strong>; you
            pay the same price you would have paid otherwise.
          </p>
          <p>
            We also link to Amazon's regional storefronts (.co.uk, .de, .fr,
            .it, .es, .ca, .com.au, .co.jp, .com.mx, and others) based on your
            browser locale. Each regional store has its own associated
            commission program.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">
            How this affects our recommendations
          </h2>
          <p>
            It does not. Our ranking engine is{" "}
            <Link to="/methodology" className="text-primary underline">
              deterministic and commission-blind
            </Link>
            . Affiliate links are appended to the result page after the
            ranking is computed; they cannot influence which watch ranks #1.
            We routinely rank watches we do not have a commission relationship
            with above watches we do.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">
            Prices and availability
          </h2>
          <p>
            Where shown, Amazon prices are fetched in near real time and may
            change between the moment you click and the moment you check out.
            The price you pay is the price shown on Amazon's product page at
            checkout — always confirm there before buying.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">
            Questions
          </h2>
          <p>
            Reach out through{" "}
            <a
              href="https://gearuptofit.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              gearuptofit.com/contact
            </a>{" "}
            if anything here is unclear.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 text-xs">
          <Link to="/methodology" className="underline text-muted-foreground hover:text-primary">
            How we score
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <a
            href="https://gearuptofit.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-muted-foreground hover:text-primary"
          >
            Privacy policy
          </a>
        </div>
      </div>
    </div>
  );
}