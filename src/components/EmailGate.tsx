import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, FileDown, Loader2, Mail, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getUTM } from "@/lib/utm";

export interface EmailGateProps {
  open: boolean;
  onClose: () => void;
  /** Called after successful subscribe OR explicit "skip". */
  onUnlock: () => void;
  /** Optional context — passed straight through to Brevo as contact attributes. */
  topMatchBrand?: string;
  topMatchModel?: string;
  category?: string;
  phoneOS?: string;
  batteryPref?: number;
  watchMatchURL?: string;
  source?: "quiz_gate" | "exit_popup" | "inline_hero" | "footer" | "blog_inline";
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}

const STORAGE_KEY = "wm_subscribed_v1";

export function hasSubscribed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export default function EmailGate({
  open,
  onClose,
  onUnlock,
  topMatchBrand,
  topMatchModel,
  category,
  phoneOS,
  batteryPref,
  watchMatchURL,
  source = "quiz_gate",
  title = "Send me the full WatchMatch report",
  subtitle = "I’ll send the private recap, buying notes, and practical follow-up guidance to your inbox before you download the PDF.",
  ctaLabel = "Send My Report",
}: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setDone(false);
      setLoading(false);
    }
  }, [open]);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!consent) {
      toast.error("Please tick the consent box to receive your report");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: trimmed,
        firstName: firstName.trim() || undefined,
        source,
        consent: true as const,
        topMatchBrand,
        topMatchModel,
        category,
        phoneOS,
        batteryPref,
        watchMatchURL,
        utm: getUTM(),
      };

      let res: { success: boolean; welcomeSent?: boolean; error?: string } | null = null;
      try {
        const rest = await fetch("/api/public/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (rest.ok) {
          res = await rest.json();
        } else {
          console.warn("Subscribe request failed", rest.status);
        }
      } catch (restErr) {
        console.warn("Subscribe request exception", restErr);
      }

      // SOTA UX: even if the email service is temporarily unreachable, do
      // not punish the user. Unlock the download, but only remember the lead
      // locally after the Day-0 email is actually accepted for sending.
      if (!res?.success) {
        toast.message("Your PDF is unlocking now.", {
          description: "Email delivery was not confirmed. Please submit again in a minute so we can resend it.",
        });
      } else if (!res.welcomeSent) {
        toast.message("Your PDF is unlocking now.", {
          description: "Your email was saved, but delivery was not confirmed yet. Try again if it does not arrive.",
        });
      }
      if (res?.welcomeSent) {
        try {
          localStorage.setItem(STORAGE_KEY, trimmed);
        } catch {
          /* ignore */
        }
      }
      try {
        (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer?.push({
          event: "lead_capture",
          source,
          watch_category: category,
          welcome_sent: res?.welcomeSent ?? false,
          delivery: res?.success ? "ok" : "deferred",
        });
      } catch {
        /* ignore */
      }
      if (res?.welcomeSent) {
        setDone(true);
      }
      setTimeout(() => onUnlock(), 1100);
    } catch (err) {
      console.error(err);
      // Last-resort safety net: still let the user proceed to their PDF.
      toast.message("We couldn't reach the email service — unlocking your PDF anyway.", {
        description: "Try again in a minute and we'll send the full report to your inbox.",
      });
      setDone(false);
      setTimeout(() => onUnlock(), 900);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-gate-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-primary/25 bg-card/95 p-6 md:p-8 shadow-2xl shadow-primary/20 backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {!done ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Human-written · practical · no spam
                  </span>
                </div>

                <h2
                  id="email-gate-title"
                  className="mb-2 text-2xl font-bold uppercase leading-tight tracking-tight md:text-[28px]"
                >
                  {title}
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

                <ul className="mb-5 space-y-2 text-xs md:text-sm">
                  {[
                    topMatchBrand && topMatchModel
                      ? `Full breakdown for your match: ${topMatchBrand} ${topMatchModel}`
                      : "Full breakdown for your top match",
                    "Plain-English buying notes: case fit, GPS, battery, and deal-breakers",
                    "A helpful expert follow-up series you can reply to anytime",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <form onSubmit={submit} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="First name (optional)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.slice(0, 60))}
                    maxLength={60}
                    autoComplete="given-name"
                    className="h-11"
                  />
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                      maxLength={255}
                      autoComplete="email"
                      className="h-11 pl-9"
                    />
                  </div>
                  <label className="flex cursor-pointer select-none items-start gap-2 text-[11px] leading-snug text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 accent-[hsl(var(--primary))]"
                    />
                    <span>
                      Yes, email my WatchMatch report and helpful follow-up notes. I can unsubscribe
                      any time. By continuing I accept the{" "}
                      <a
                        href="https://gearuptofit.com/privacy-policy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        privacy policy
                      </a>
                      .
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full bg-gradient-primary font-bold uppercase tracking-[0.12em] glow-primary hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" /> {ctaLabel}
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-1 text-[11px] text-muted-foreground/70 transition hover:text-muted-foreground"
                  >
                    No thanks, keep browsing online
                  </button>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/15">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold uppercase">Check your inbox!</h3>
                <p className="text-sm text-muted-foreground">
                  Your report is on its way. Preparing your PDF…
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}