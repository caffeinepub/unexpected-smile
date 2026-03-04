import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ExternalLink,
  Film,
  Heart,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Play,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { Package, PortfolioEntry } from "../backend.d";
import {
  useGetPackages,
  useGetPublishedPortfolioEntries,
} from "../hooks/useQueries";

const WHATSAPP_NUMBER = "7672000898";
const WHATSAPP_LINK = `https://wa.me/91${WHATSAPP_NUMBER}`;
const CONTACT_EMAIL = "saikiranpathulothu71@gmail.com";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function formatPrice(price: bigint): string {
  return price.toLocaleString("en-IN");
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function PortfolioCard({
  entry,
  index,
  onPlayClick,
}: {
  entry: PortfolioEntry;
  index: number;
  onPlayClick: (entry: PortfolioEntry) => void;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      data-ocid={`portfolio.item.${index + 1}`}
      className="group relative overflow-hidden rounded-xl bg-card card-glow card-glow-hover cursor-pointer transition-all duration-300"
      onClick={() => entry.embedUrl && onPlayClick(entry)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {entry.thumbnailBlobId ? (
          <img
            src={entry.thumbnailBlobId}
            alt={entry.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-charcoal to-muted">
            <Film className="w-12 h-12 text-gold-dim opacity-40" />
          </div>
        )}
        {entry.embedUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center shadow-gold-md">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg text-foreground mb-1 line-clamp-1">
          {entry.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {entry.description}
        </p>
        {entry.embedUrl && (
          <div className="mt-3 flex items-center gap-1.5 text-gold text-xs font-medium">
            <Play className="w-3.5 h-3.5" />
            <span>Watch Tribute</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Thumbnail fallbacks per package index
const PACKAGE_THUMBNAILS = [
  {
    image: "/assets/generated/package-basic-tribute.dim_600x400.jpg",
    gradient:
      "from-[oklch(0.18_0.03_60)] via-[oklch(0.22_0.05_70)] to-[oklch(0.16_0.02_50)]",
    icon: "🕯️",
    label: "Basic Tribute",
  },
  {
    image: "/assets/generated/package-family-special.dim_600x400.jpg",
    gradient:
      "from-[oklch(0.20_0.06_75)] via-[oklch(0.25_0.08_78)] to-[oklch(0.18_0.04_65)]",
    icon: "👨‍👩‍👧‍👦",
    label: "Family Special",
  },
  {
    image: "/assets/generated/package-grand-cinematic.dim_600x400.jpg",
    gradient:
      "from-[oklch(0.15_0.04_55)] via-[oklch(0.22_0.07_72)] to-[oklch(0.18_0.05_80)]",
    icon: "🎬",
    label: "Cinematic",
  },
];

function getVoiceLabel(pkgName: string): string {
  if (
    pkgName.toLowerCase().includes("grand") ||
    pkgName.toLowerCase().includes("cinematic")
  ) {
    return "Full Voice Message";
  }
  return "Their Voice";
}

function PricingCard({
  pkg,
  index,
  onBook,
}: {
  pkg: Package;
  index: number;
  onBook: (id: bigint) => void;
}) {
  const thumb = PACKAGE_THUMBNAILS[index] ?? PACKAGE_THUMBNAILS[0];
  const voiceLabel = getVoiceLabel(pkg.name);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      data-ocid={`pricing.item.${index + 1}`}
      className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        pkg.isBestSeller
          ? "bg-gradient-to-b from-[oklch(0.20_0.04_78)] to-card ring-1 ring-gold/40 glow-gold"
          : "bg-card card-glow"
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative w-full h-40 bg-gradient-to-br ${thumb.gradient} flex flex-col items-center justify-center gap-2 overflow-hidden`}
      >
        {pkg.thumbnailBlobId ? (
          <img
            src={pkg.thumbnailBlobId}
            alt={pkg.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : thumb.image ? (
          <img
            src={thumb.image}
            alt={thumb.label}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <>
            <div className="text-5xl">{thumb.icon}</div>
            <p className="text-gold/60 text-xs font-semibold uppercase tracking-widest">
              {thumb.label}
            </p>
          </>
        )}
        {/* Subtle film-grain overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')] pointer-events-none" />
      </div>

      {pkg.isBestSeller && (
        <div className="absolute top-[148px] inset-x-0 flex justify-center">
          <div className="bg-gold text-primary-foreground text-xs font-bold tracking-widest uppercase px-6 py-1.5 rounded-b-lg shadow-lg">
            ✦ Best Seller
          </div>
        </div>
      )}

      <div
        className={`p-7 flex flex-col flex-1 ${pkg.isBestSeller ? "pt-8" : ""}`}
      >
        {/* Package Title */}
        <div className="mb-5">
          <h3 className="font-display text-xl font-semibold text-foreground mb-1">
            {pkg.name}
          </h3>
          {pkg.tagline && (
            <p className="text-gold-dim text-sm italic font-serif-alt">
              {pkg.tagline}
            </p>
          )}
        </div>

        {/* Price Options */}
        <div className="space-y-3 mb-5 flex-1">
          {/* Video Only */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Video Only
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-foreground">
                ₹ {formatPrice(pkg.videoOnlyPrice)}/-
              </span>
            </div>
          </div>
          {/* Voice Addon */}
          <div className="rounded-lg bg-gold/5 border border-gold/20 px-4 py-3">
            <div className="text-xs text-gold/70 uppercase tracking-wider mb-1">
              Video + {voiceLabel}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-gold">
                ₹ {formatPrice(pkg.voiceAddonPrice)}/-
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-6 border-t border-border/40 pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Film className="w-4 h-4 text-gold/60 flex-shrink-0 mt-0.5" />
            <span>{pkg.durationDescription}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-gold/60 flex-shrink-0 mt-0.5" />
            <span>{pkg.memberDetails}</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          data-ocid={`pricing.book_button.${index + 1}`}
          onClick={() => onBook(pkg.id)}
          className={`w-full font-semibold tracking-wide ${
            pkg.isBestSeller
              ? "bg-gold text-primary-foreground hover:bg-gold-light"
              : "bg-secondary text-foreground hover:bg-secondary/80 border border-gold/20"
          }`}
          size="lg"
        >
          Book This Package
        </Button>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const pricingRef = useRef<HTMLDivElement>(null);
  const [embedEntry, setEmbedEntry] = useState<PortfolioEntry | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: packages, isLoading: packagesLoading } = useGetPackages();
  const { data: portfolio, isLoading: portfolioLoading } =
    useGetPublishedPortfolioEntries();

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBookPackage = (packageId: bigint) => {
    navigate({ to: "/book", search: { packageId: packageId.toString() } });
  };

  const navLinks = [
    { label: "Home", action: scrollToTop, ocid: "nav.home_link" },
    {
      label: "Our Services",
      action: () => scrollToSection("services"),
      ocid: "nav.services_link",
    },
    {
      label: "Pricing Details",
      action: () => scrollToSection("pricing"),
      ocid: "nav.pricing_link",
    },
    {
      label: "Reviews",
      action: () => scrollToSection("reviews"),
      ocid: "nav.reviews_link",
    },
    {
      label: "My Orders",
      action: () => navigate({ to: "/client-dashboard" }),
      ocid: "nav.orders_link",
    },
    {
      label: "Contact Us",
      action: () => scrollToSection("contact"),
      ocid: "nav.contact_link",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Nav ──────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 header-cinematic backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Heart className="w-5 h-5 text-gold" />
            <span className="font-display font-semibold text-lg text-foreground tracking-tight">
              UNEXPECTED<span className="text-gold">.SMILE</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.ocid}
                type="button"
                data-ocid={link.ocid}
                onClick={() => link.action()}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              data-ocid="nav.admin_link"
              onClick={() => navigate({ to: "/admin/login" })}
              className="px-3 py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded-lg hover:bg-white/5"
            >
              Admin
            </button>
            <Button
              data-ocid="nav.book_button"
              onClick={scrollToPricing}
              size="sm"
              className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
            >
              Book Your Surprise
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            data-ocid="nav.mobile_menu_button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile nav sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="bg-card border-border w-72"
          data-ocid="nav.mobile_sheet"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 font-display">
              <Heart className="w-5 h-5 text-gold" />
              <span className="text-foreground">
                UNEXPECTED<span className="text-gold">.SMILE</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.ocid}
                type="button"
                data-ocid={link.ocid}
                onClick={() => {
                  link.action();
                  setMobileMenuOpen(false);
                }}
                className="text-left px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <Button
                data-ocid="nav.book_button"
                onClick={() => {
                  scrollToPricing();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
              >
                Book Your Surprise
              </Button>
              <button
                type="button"
                data-ocid="nav.admin_link"
                onClick={() => {
                  navigate({ to: "/admin/login" });
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center text-xs text-muted-foreground/40 hover:text-muted-foreground/70 py-2 transition-colors"
              >
                Admin Login
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cinematic gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.18_0.05_45)_0%,oklch(0.10_0.03_30)_40%,oklch(0.07_0.01_0)_100%)]" />
          {/* Warm amber glow top-right */}
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_top_right,oklch(0.35_0.12_65)_0%,transparent_60%)] opacity-30" />
          {/* Gold glow bottom-left */}
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.28_0.10_55)_0%,transparent_60%)] opacity-20" />
          {/* Bottom gradient for smooth section transition */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/25 bg-gold/8 text-gold text-xs font-semibold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                AI Memorial Tribute Videos
              </span>
            </motion.div>

            <motion.p
              variants={fadeUp}
              custom={0.5}
              className="text-muted-foreground/80 text-base sm:text-lg mb-3 font-serif-alt italic"
            >
              Hello 🙏 Are you missing someone dearly on your upcoming Wedding,
              Birthday or Special Event?
            </motion.p>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
            >
              <span className="text-foreground">Bring Their Blessings</span>
              <br />
              <span className="text-gradient-gold">
                Back To Your Special Day
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
            >
              We create deeply emotional AI-powered tribute videos that bring
              your late loved ones back to your most precious celebrations —
              preserving their voice, their smile, their essence forever.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                data-ocid="hero.primary_button"
                onClick={scrollToPricing}
                size="lg"
                className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold text-base px-8 h-14 glow-gold"
              >
                Book Your Surprise
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-gold/40 rounded-lg px-6 h-14 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                Chat on WhatsApp
              </a>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float"
          >
            <ChevronDown className="w-6 h-6 text-gold/40" />
          </motion.div>
        </div>
      </section>

      {/* ─── Values & Service ─────────────────────────────────── */}
      <section id="services" className="py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              className="text-gold text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Our Promise
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-8"
            >
              Why Families Trust Us
            </motion.h2>
            <motion.div
              variants={fadeUp}
              className="bg-card rounded-2xl p-8 sm:p-12 card-glow text-left space-y-6"
            >
              <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-serif-alt italic border-l-4 border-gold/40 pl-6">
                At UNEXPECTED.SMILE, we bridge memories and reality. Using
                advanced AI technology, we bring your late loved ones back into
                your celebrations through cinematic emotional videos.
              </p>
              <div className="border-t border-border/50 pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-base font-semibold text-gold">
                    Why Our Service Has Value?
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed text-base pl-8">
                  This is not simple editing. We spend hours using premium AI
                  tools to recreate expressions, smile and most importantly
                  their natural Voice. This becomes a lifetime emotional memory.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {[
                  {
                    icon: <Heart className="w-5 h-5" />,
                    label: "Emotionally Crafted",
                    desc: "Every frame made with love and respect",
                  },
                  {
                    icon: <Film className="w-5 h-5" />,
                    label: "Premium AI Tools",
                    desc: "Hours of careful work, not just automation",
                  },
                  {
                    icon: <Star className="w-5 h-5" />,
                    label: "Lifetime Memory",
                    desc: "A gift that lasts for generations",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/20 border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-3">
                      {item.icon}
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Portfolio ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-gold text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Our Work
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              Tribute Gallery
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground mt-4 max-w-xl mx-auto"
            >
              Each tribute is a unique celebration of a life lived — crafted
              with compassion, artistry, and the latest in AI technology.
            </motion.p>
          </motion.div>

          {portfolioLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {["sk-1", "sk-2", "sk-3"].map((id) => (
                <div key={id} className="rounded-xl overflow-hidden bg-card">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !portfolio || portfolio.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="portfolio.empty_state"
              className="text-center py-20 rounded-2xl border border-dashed border-border bg-card/30"
            >
              <Film className="w-12 h-12 text-gold/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-display">
                Tributes are being crafted with love
              </p>
              <p className="text-muted-foreground/60 text-sm mt-2">
                Our first portfolio pieces will appear here soon.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {portfolio.map((entry, i) => (
                <PortfolioCard
                  key={entry.id.toString()}
                  entry={entry}
                  index={i}
                  onPlayClick={setEmbedEntry}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" ref={pricingRef} className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-gold text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Packages
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              Choose Your Tribute
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground mt-4 max-w-xl mx-auto"
            >
              Each package includes a heartfelt AI memorial video crafted
              specifically for your loved one.
            </motion.p>
          </motion.div>

          {packagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["pkg-sk-1", "pkg-sk-2", "pkg-sk-3"].map((id) => (
                <Skeleton key={id} className="h-[500px] w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {(packages ?? []).map((pkg, i) => (
                <PricingCard
                  key={pkg.id.toString()}
                  pkg={pkg}
                  index={i}
                  onBook={handleBookPackage}
                />
              ))}
            </motion.div>
          )}

          {/* Global voice note */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-gold/8 border border-gold/25 rounded-full px-6 py-3">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <p className="text-sm text-gold font-serif-alt italic">
                "Voice Option creates the most realistic experience as if they
                are speaking again."
              </p>
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-gold text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Got Questions?
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              Frequently Asked
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            data-ocid="faq.section"
          >
            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: "How long does the video creation take?",
                  a: "Standard delivery is within 3 days. We also offer an emergency fast delivery option for an additional ₹500.",
                },
                {
                  q: "What photos do I need to provide?",
                  a: "Please provide a clear, single photo of the late person. For family members, full photos work best. For the most realistic clarity, you can also share your specific background images (wedding backgrounds are highly recommended).",
                },
                {
                  q: "Is my ₹100 deposit refundable?",
                  a: "Yes, refunds are accepted if you provide a valid and valuable reason before the video production begins.",
                },
                {
                  q: "Have a different query?",
                  a: "You can directly contact our support team on WhatsApp at 7672000898.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${i}`}
                  data-ocid={`faq.item.${i + 1}`}
                  className="faq-item rounded-xl px-6 border-0"
                >
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:text-gold hover:no-underline py-5 [&[data-state=open]]:text-gold">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5 text-sm">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ─── Reviews ─────────────────────────────────────────── */}
      <section id="reviews" className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-gold text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Client Stories
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              What Families Say
            </motion.h2>
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-1 mt-4"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 star-gold fill-current" />
              ))}
              <span className="ml-2 text-muted-foreground text-sm font-medium">
                5.0 · Trusted by families across India
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Priya Sharma",
                location: "Hyderabad",
                event: "Wedding Tribute",
                rating: 5,
                text: "We were in tears when we saw the video. My father-in-law who passed away last year was there at the wedding in spirit, and seeing him speak again — it felt like a miracle. UNEXPECTED.SMILE gave us a gift we will treasure forever.",
              },
              {
                name: "Rajesh Kumar",
                location: "Bangalore",
                event: "Birthday Surprise",
                rating: 5,
                text: "My mother's 60th birthday was made extraordinary. We had a tribute video of my late grandfather blessing her. The quality of the AI recreation was unbelievably realistic — everyone was moved deeply. Truly worth every rupee.",
              },
              {
                name: "Ananya Reddy",
                location: "Chennai",
                event: "Family Reunion",
                rating: 5,
                text: "The team was incredibly sensitive and professional. They recreated my grandmother's smile and voice perfectly. This was our family's most emotional and beautiful moment. I cannot recommend UNEXPECTED.SMILE enough.",
              },
            ].map((review, i) => (
              <motion.div
                key={review.name}
                variants={fadeUp}
                custom={i}
                data-ocid={`review.item.${i + 1}`}
                className="review-card rounded-2xl p-7 flex flex-col gap-4"
              >
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 star-gold fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 font-serif-alt italic">
                  "{review.text}"
                </p>
                <div className="border-t border-border/40 pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-semibold text-sm">
                      {review.name}
                    </p>
                    <p className="text-muted-foreground/60 text-xs">
                      {review.location} · {review.event}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-gold" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Contact ─────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-gold text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Get In Touch
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              Contact Us
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground mt-4 max-w-lg mx-auto"
            >
              Have questions? We're here to help you create the perfect tribute
              for your loved one.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            data-ocid="contact.section"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Email */}
            <motion.div
              variants={fadeUp}
              className="bg-card rounded-2xl p-7 card-glow text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Email Us
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                For detailed inquiries and project discussions
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-gold text-sm font-medium hover:text-gold-dim transition-colors break-all"
              >
                {CONTACT_EMAIL}
              </a>
            </motion.div>

            {/* WhatsApp */}
            <motion.div
              variants={fadeUp}
              className="bg-card rounded-2xl p-7 card-glow text-center"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                WhatsApp
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Quick responses for urgent queries
              </p>
              <p className="text-foreground font-medium mb-4">
                +91 {WHATSAPP_NUMBER}
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="contact.whatsapp_button"
                className="inline-flex items-center gap-2 bg-green-700/20 hover:bg-green-700/30 border border-green-600/40 text-green-400 hover:text-green-300 rounded-xl px-5 py-2.5 transition-all text-sm font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                Open WhatsApp
              </a>
            </motion.div>

            {/* Direct Message */}
            <motion.div
              variants={fadeUp}
              className="bg-card rounded-2xl p-7 card-glow text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Direct Message
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upload files and send messages linked to your order
              </p>
              <button
                type="button"
                data-ocid="contact.message_button"
                onClick={() => navigate({ to: "/client-dashboard" })}
                className="inline-flex items-center gap-2 bg-gold/10 hover:bg-gold/15 border border-gold/25 hover:border-gold/40 text-gold rounded-xl px-5 py-2.5 transition-all text-sm font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="py-16 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Heart className="w-5 h-5 text-gold" />
                <span className="font-display text-xl font-semibold text-foreground">
                  UNEXPECTED<span className="text-gold">.SMILE</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm italic font-serif-alt">
                Honouring lives. Preserving legacies. Forever.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span>+91 {WHATSAPP_NUMBER}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <p className="text-xs text-muted-foreground/50">
                © {new Date().getFullYear()}. Built with{" "}
                <Heart className="inline w-3 h-3 text-gold" /> using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold/60 hover:text-gold transition-colors"
                >
                  caffeine.ai
                </a>
              </p>
              <button
                type="button"
                data-ocid="footer.admin_link"
                onClick={() => navigate({ to: "/admin/login" })}
                className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Floating WhatsApp ──────────────────────────────── */}
      <a
        href="https://wa.me/917672000898"
        target="_blank"
        rel="noopener noreferrer"
        data-ocid="whatsapp.float_button"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      {/* ─── Embed Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {embedEntry && (
          <Dialog open={!!embedEntry} onOpenChange={() => setEmbedEntry(null)}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card">
              <div className="aspect-video w-full">
                {embedEntry.embedUrl && (
                  <iframe
                    src={embedEntry.embedUrl}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    title={embedEntry.title}
                  />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {embedEntry.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {embedEntry.description}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
