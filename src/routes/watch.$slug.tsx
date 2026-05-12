import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { watchDatabase, type Watch } from "@/lib/watch-database";
import { amazonURL, categoryImage } from "@/lib/amazon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Battery,
  Droplets,
  ExternalLink,
  Ruler,
  ShoppingCart,
  Sparkles,
  Watch as WatchIcon,
  Weight,
  Smartphone,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/watch/$slug")({
  loader: ({ params }) => {
    const watch = watchDatabase.find((w) => w.id === params.slug);
    if (!watch) throw notFound();
    return { watch };
  },
  head: ({ loaderData }) => {
    const w = loaderData?.watch;
    if (!w) return { meta: [{ title: "Watch not found" }] };
    const title = `${w.brand} ${w.model} — Specs, Battery & Features`;
    const description = w.highlight;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(w.imageURL ? [{ property: "og:image", content: w.imageURL }] : []),
      ],
    };
  },
  component: WatchDetailPage,
  errorComponent: ({ error }) => (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Watch not found</h1>
      <Link to="/" className="underline">
        Back home
      </Link>
    </div>
  ),
});

const FEATURE_LABELS: Record<string, string> = {
  gps: "Built-in GPS",
  ecg: "ECG (heart rhythm)",
  spo2: "Blood oxygen (SpO₂)",
  music: "On-device music",
  lte: "LTE / cellular",
  payments: "Contactless payments",
  amoled: "AMOLED display",
  maps: "Offline maps",
  swim: "Swim tracking",
  sleep: "Advanced sleep tracking",
  stress: "Stress tracking",
  temperature: "Skin temperature",
};

function WatchDetailPage() {
  const { watch } = Route.useLoaderData() as { watch: Watch };
  const img = categoryImage(watch);
  const buyUrl = amazonURL(watch);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-8 items-start"
        >
          <div className="rounded-2xl border bg-card p-6 flex items-center justify-center">
            <img
              src={img}
              alt={`${watch.brand} ${watch.model}`}
              className="max-h-[420px] w-auto object-contain"
              loading="eager"
            />
          </div>

          <div>
            <Badge variant="secondary" className="mb-3 capitalize">
              {watch.category}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              {watch.brand} {watch.model}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{watch.highlight}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold">${watch.priceUSD}</span>
              <span className="text-sm text-muted-foreground">MSRP</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={buyUrl} target="_blank" rel="noopener noreferrer sponsored">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy on Amazon
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">
                  <Sparkles className="h-4 w-4 mr-2" /> Take the quiz
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Specifications</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SpecCard icon={<Battery className="h-5 w-5" />} label="Battery life" value={`${watch.batteryDays} days`} />
            <SpecCard icon={<WatchIcon className="h-5 w-5" />} label="Display" value={watch.display} />
            <SpecCard icon={<Ruler className="h-5 w-5" />} label="Case size" value={`${watch.caseSizeMM} mm`} />
            <SpecCard icon={<Weight className="h-5 w-5" />} label="Weight" value={`${watch.weightGrams} g`} />
            <SpecCard icon={<Droplets className="h-5 w-5" />} label="Water rating" value={watch.waterRating} />
            <SpecCard icon={<Calendar className="h-5 w-5" />} label="Released" value={String(watch.year)} />
            <SpecCard
              icon={<Smartphone className="h-5 w-5" />}
              label="Phone support"
              value={watch.phones.includes("both") ? "iPhone & Android" : watch.phones.map(cap).join(", ")}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Feature highlights</h2>
          {watch.features.length === 0 ? (
            <p className="text-muted-foreground">No tracked features listed.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {watch.features.map((f) => (
                <Badge key={f} variant="outline" className="text-sm py-1.5 px-3">
                  {FEATURE_LABELS[f] ?? cap(f)}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Best for</h2>
          <div className="flex flex-wrap gap-2">
            {watch.bestFor.map((u) => (
              <Badge key={u} className="capitalize">{u}</Badge>
            ))}
            {watch.style.map((s) => (
              <Badge key={s} variant="secondary" className="capitalize">{s} style</Badge>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-2 text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}