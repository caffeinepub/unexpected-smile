import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Heart,
  Home,
  MessageCircle,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "917672000898";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [packageName, setPackageName] = useState<string>("Selected Package");

  useEffect(() => {
    const stored = sessionStorage.getItem("confirmedBookingId");
    const storedPkg = sessionStorage.getItem("confirmedPackageName");
    if (stored) {
      setBookingId(stored);
    }
    if (storedPkg) {
      setPackageName(storedPkg);
    }
  }, []);

  const whatsappMessage = encodeURIComponent(
    `Hello UNEXPECTED.SMILE! I have paid the ₹100 deposit. My Order ID is: ${bookingId ?? ""} for the ${packageName}. Here are my reference photos and audio.`,
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-gold/4 blur-3xl" />
      </div>

      <div className="max-w-lg w-full text-center relative">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="relative mx-auto mb-8 w-24 h-24"
        >
          {/* Glow rings */}
          <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gold/15 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">
              Order Submitted
            </span>
            <Heart className="w-4 h-4 text-gold" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Order Pending Verification!
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            Please click below to send us your reference photos via WhatsApp, or
            upload them directly here.
          </p>

          {/* Booking ID */}
          {bookingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-xl p-5 border border-border card-glow mb-6"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Booking Reference ID
              </p>
              <code className="text-gold font-mono text-lg font-bold">
                #{bookingId}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                {packageName}
              </p>
            </motion.div>
          )}

          {/* Primary action buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 mb-6"
          >
            {/* WhatsApp primary CTA */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="confirmation.whatsapp_button"
              className="flex items-center justify-center gap-3 w-full bg-green-700/20 hover:bg-green-700/30 border border-green-600/40 text-green-400 hover:text-green-300 rounded-xl py-4 transition-all duration-200 font-semibold text-sm"
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <span>Send via WhatsApp</span>
            </a>

            {/* Direct upload outlined gold button */}
            <button
              type="button"
              data-ocid="confirmation.upload_button"
              onClick={() =>
                navigate({
                  to: "/client-dashboard",
                  search: bookingId ? { bookingId } : undefined,
                })
              }
              className="flex items-center justify-center gap-3 w-full bg-transparent hover:bg-gold/5 border border-gold/30 hover:border-gold/60 text-gold rounded-xl py-4 transition-all duration-200 font-semibold text-sm"
            >
              <Upload className="w-5 h-5 flex-shrink-0" />
              <span>Upload Directly Here</span>
            </button>
          </motion.div>

          {/* Status flow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-card rounded-xl p-5 border border-border mb-6"
          >
            <div className="flex items-start gap-3 text-left">
              <Clock className="w-5 h-5 text-gold/60 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="text-foreground font-medium mb-2">
                  What happens next?
                </p>
                <ol className="space-y-1.5 list-none">
                  <li>1. Admin verifies your ₹100 UTR payment</li>
                  <li>
                    2. Send your photos & audio via WhatsApp or direct upload
                  </li>
                  <li>3. You receive a WhatsApp confirmation</li>
                  <li>4. Production begins on your tribute video</li>
                  <li>5. Your completed video is delivered</li>
                </ol>
              </div>
            </div>
          </motion.div>

          {/* Return home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/" })}
              className="w-full border border-border hover:border-gold/30 text-muted-foreground hover:text-foreground"
            >
              <Home className="mr-2 w-4 h-4" />
              Return to Home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
