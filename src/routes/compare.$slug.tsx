import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Battery,
  CheckCircle2,
  Droplets,
  ExternalLink,
  Ruler,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Trophy,
  Watch as WatchIcon,
  Weight,
  Zap,
} from "lucide-react";
import {
  buildCompareSlug,
  getCompareWatches,
  pickWinner,
  type WinnerAxis,
} from "@/lib/compare";
import type { Watch } from "@/lib/watch-database";
import { amazonURL, categoryImage } from "@/lib/amazon";
import { useAmazonHost } from "@/hooks/use-amazon-host";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";

const ORIGIN = "https://wrist-wonderland-hub.lovable.app";

export const Route = createFileRoute("/compare/$slug")({
  loader: ({ params }) => {
    const pair = getCompareWatches(params.slug);
    if (!pair) throw notFound();
    const canonical = buildCompareSlug(pair.a.id, pair.b.id);
    // Force the canonical (alphabetical) URL — protects against duplicate
    // indexing of `b-vs-a` and `a-vs-b`.
    if (canonical !== params.slug) {
      throw redirect({ to: "/compare/$slug", params: { slug: canonical }, replace: true });
    }
    return { a: pair.a, b: pair.b };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Compare" }] };
    const { a, b } = loaderData;
    const title = `${a.brand} ${a.model} vs ${b.brand} ${b.model} — Side-by-side Comparison`;
    const description = `Compare the ${a.brand} ${a.model} vs the ${b.brand} ${b.model}: battery life, GPS, weight, features and price. Honest spec-by-spec breakdown to help you pick the right watch.`;
    const canonical = `${ORIGIN}/compare/${buildCompareSlug(a.id, b.id)}`;
    const image = a.imageURL || b.imageURL;

    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${a.brand} ${a.model} vs ${b.brand} ${b.model}`,
      itemListElement: [a, b].map((w, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: `${w.brand} ${w.model}`,
          brand: { "@type": "Brand", name: w.brand },
          description: w.highlight,
          ...(w.imageURL ? { image: w.imageURL } : {}),
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: String(w.priceUSD),
            availability: "https://schema.org/InStock",
            url: `${ORIGIN}/watch/${encodeURIComponent(w.id)}`,
          },
        },
      })),
    };

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "Compare", item: `${ORIGIN}/compare` },
        { "@type": "ListItem", position: 3, name: `${a.brand} ${a.model} vs ${b.brand} ${b.model}`, item: canonical },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(itemListLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      ],
    };
  },
  component: ComparePage,
  notFoundComponent: () => (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Comparison not found</h1>
      <Link to="/" className="underline">Back home</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function ComparePage() {
  const { a, b } = Route.useLoaderData() as { a: Watch; b: Watch };
  const host = useAmazonHost();

  // Aggregate score across the 5 measurable axes to crown an overall winner.
  const axes: WinnerAxis[] = ["battery", "weight", "price", "features", "water"];
  const tally = { a: 0, b: 0 };
  for (const axis of axes) {
    const w = pickWinner(a, b, axis);
    if (w?.id === a.id) tally.a++;
    else if (w?.id === b.id) tally.b++;
  }
  const overall = tally.a === tally.b ? null : tally.a > tally.b ? a : b;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <header className="mb-8">
          <Badge variant="secondary" className="mb-3 uppercase tracking-wider">
            Head-to-head · {a.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {a.brand} {a.model}{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            {b.brand} {b.model}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            A spec-by-spec, real-world comparison to help you pick the right watch
            for your wrist, your phone and your training.
          </p>
          {overall && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-primary" />
              Overall winner on raw specs: {overall.brand} {overall.model}
              <span className="text-muted-foreground font-normal">
                ({tally.a}–{tally.b})
              </span>
            </div>
          )}
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {[a, b].map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="rounded-xl border bg-card flex items-center justify-center p-4 mb-4 min-h-[220px]">
                    <img
                      src={categoryImage(w)}
                      alt={`${w.brand} ${w.model}`}
                      className="max-h-48 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                  <Badge variant="secondary" className="capitalize mb-2">
                    {w.category}
                  </Badge>
                  <h2 className="text-2xl font-bold">
                    {w.brand} {w.model}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{w.highlight}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">${w.priceUSD}</span>
                    <span className="text-xs text-muted-foreground">MSRP</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <a
                        href={amazonURL(w, { host })}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Buy on Amazon{host !== "com" ? `.${host}` : ""}
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/watch/$slug" params={{ slug: w.id }}>
                        Full specs
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Spec-by-spec</h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Spec</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    {a.brand} {a.model}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">
                    {b.brand} {b.model}
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Battery (GPS-on, days)"
                  icon={<Battery className="h-4 w-4" />}
                  aVal={`${a.batteryDays} d`}
                  bVal={`${b.batteryDays} d`}
                  winner={pickWinner(a, b, "battery")}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Weight"
                  icon={<Weight className="h-4 w-4" />}
                  aVal={`${a.weightGrams} g`}
                  bVal={`${b.weightGrams} g`}
                  winner={pickWinner(a, b, "weight")}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Price (MSRP)"
                  icon={<Zap className="h-4 w-4" />}
                  aVal={`$${a.priceUSD}`}
                  bVal={`$${b.priceUSD}`}
                  winner={pickWinner(a, b, "price")}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Water rating"
                  icon={<Droplets className="h-4 w-4" />}
                  aVal={a.waterRating}
                  bVal={b.waterRating}
                  winner={pickWinner(a, b, "water")}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Tracked features"
                  icon={<Sparkles className="h-4 w-4" />}
                  aVal={`${a.features.length}`}
                  bVal={`${b.features.length}`}
                  winner={pickWinner(a, b, "features")}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Case size"
                  icon={<Ruler className="h-4 w-4" />}
                  aVal={`${a.caseSizeMM} mm`}
                  bVal={`${b.caseSizeMM} mm`}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Display"
                  icon={<WatchIcon className="h-4 w-4" />}
                  aVal={a.display}
                  bVal={b.display}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Phone support"
                  icon={<Smartphone className="h-4 w-4" />}
                  aVal={a.phones.includes("both") ? "iPhone & Android" : a.phones.join(", ")}
                  bVal={b.phones.includes("both") ? "iPhone & Android" : b.phones.join(", ")}
                  a={a}
                  b={b}
                />
                <ComparisonRow
                  label="Released"
                  aVal={String(a.year)}
                  bVal={String(b.year)}
                  a={a}
                  b={b}
                />
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Feature overlap</h2>
          <FeatureOverlap a={a} b={b} />
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Bottom line</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <BottomLine watch={a} otherWatch={b} />
            <BottomLine watch={b} otherWatch={a} />
          </div>
        </section>

        <div className="mt-12">
          <AffiliateDisclosure variant="footer" />
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  icon,
  aVal,
  bVal,
  winner,
  a,
  b,
}: {
  label: string;
  icon?: React.ReactNode;
  aVal: string;
  bVal: string;
  winner?: Watch | null;
  a: Watch;
  b: Watch;
}) {
  const aWins = winner?.id === a.id;
  const bWins = winner?.id === b.id;
  return (
    <tr className="border-t">
      <td className="px-4 py-3 font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          {icon}
          {label}
        </span>
      </td>
      <td className={`px-4 py-3 ${aWins ? "font-bold text-foreground" : ""}`}>
        <span className="inline-flex items-center gap-1.5">
          {aWins && <Trophy className="h-3.5 w-3.5 text-primary" />}
          {aVal}
        </span>
      </td>
      <td className={`px-4 py-3 ${bWins ? "font-bold text-foreground" : ""}`}>
        <span className="inline-flex items-center gap-1.5">
          {bWins && <Trophy className="h-3.5 w-3.5 text-primary" />}
          {bVal}
        </span>
      </td>
    </tr>
  );
}

const FEATURE_LABELS: Record<string, string> = {
  gps: "Built-in GPS",
  ecg: "ECG",
  spo2: "SpO₂",
  music: "On-device music",
  lte: "LTE / cellular",
  payments: "Payments",
  amoled: "AMOLED display",
  maps: "Offline maps",
  swim: "Swim tracking",
  sleep: "Advanced sleep",
  stress: "Stress tracking",
  temperature: "Skin temperature",
};

function FeatureOverlap({ a, b }: { a: Watch; b: Watch }) {
  const aSet = new Set(a.features);
  const bSet = new Set(b.features);
  const shared = a.features.filter((f) => bSet.has(f));
  const onlyA = a.features.filter((f) => !bSet.has(f));
  const onlyB = b.features.filter((f) => !aSet.has(f));
  const label = (f: string) => FEATURE_LABELS[f] ?? f;
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
            Shared ({shared.length})
          </h3>
          {shared.length === 0 ? (
            <p className="text-sm text-muted-foreground">No overlap.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {shared.map((f) => (
                <li key={f} className="inline-flex items-center gap-2 mr-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {label(f)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
            Only on {a.brand} {a.model} ({onlyA.length})
          </h3>
          {onlyA.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing unique.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {onlyA.map((f) => (
                <li key={f}>{label(f)}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
            Only on {b.brand} {b.model} ({onlyB.length})
          </h3>
          {onlyB.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing unique.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {onlyB.map((f) => (
                <li key={f}>{label(f)}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BottomLine({ watch, otherWatch }: { watch: Watch; otherWatch: Watch }) {
  const cheaper = watch.priceUSD < otherWatch.priceUSD;
  const longerBattery = watch.batteryDays > otherWatch.batteryDays;
  const lighter = watch.weightGrams < otherWatch.weightGrams;
  const moreFeatures = watch.features.length > otherWatch.features.length;

  const reasons: string[] = [];
  if (cheaper) reasons.push(`saves $${otherWatch.priceUSD - watch.priceUSD} vs the ${otherWatch.model}`);
  if (longerBattery)
    reasons.push(`lasts ${(watch.batteryDays - otherWatch.batteryDays).toFixed(1)} more days on GPS`);
  if (lighter) reasons.push(`is ${otherWatch.weightGrams - watch.weightGrams}g lighter on the wrist`);
  if (moreFeatures)
    reasons.push(`tracks ${watch.features.length - otherWatch.features.length} more features`);
  if (reasons.length === 0) reasons.push(`matches the ${otherWatch.model} on every measurable axis`);

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-bold text-lg">
          Pick the {watch.brand} {watch.model} if you want…
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <span>It {r}.</span>
            </li>
          ))}
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/60" />
            <span>{watch.highlight}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}