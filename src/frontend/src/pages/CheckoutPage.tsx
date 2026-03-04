import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Variant_videoOnly_videoAndVoice } from "../backend.d";
import { useCreateBooking, useGetPackages } from "../hooks/useQueries";

const WHATSAPP_NUMBER = "7672000898";
const UPI_ID = "7672000898@axl";
const ADVANCE_AMOUNT = BigInt(100);

interface StoredBookingData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageId: string;
  addOn: Variant_videoOnly_videoAndVoice;
  customInstructions: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: packages } = useGetPackages();
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const [bookingData, setBookingData] = useState<StoredBookingData | null>(
    null,
  );
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("bookingData");
    if (!stored) {
      navigate({ to: "/book" });
      return;
    }
    try {
      setBookingData(JSON.parse(stored));
    } catch {
      navigate({ to: "/book" });
    }
  }, [navigate]);

  const selectedPackage = packages?.find(
    (p) => p.id.toString() === bookingData?.packageId,
  );

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setUpiCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setUpiCopied(false), 2000);
    } catch {
      toast.error("Could not copy UPI ID");
    }
  };

  const validateUTR = (): boolean => {
    const cleaned = utrNumber.replace(/\s/g, "");
    if (!cleaned) {
      setUtrError("UTR number is required");
      return false;
    }
    if (cleaned.length !== 12) {
      setUtrError("UTR must be exactly 12 digits");
      return false;
    }
    if (!/^\d{12}$/.test(cleaned)) {
      setUtrError("UTR must contain only digits");
      return false;
    }
    setUtrError("");
    return true;
  };

  const handleConfirm = async () => {
    if (!validateUTR()) return;
    if (!bookingData) return;

    try {
      setIsSuccess(false);
      const bookingId = await createBooking({
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
        packageId: BigInt(bookingData.packageId),
        addOn: bookingData.addOn,
        customInstructions: bookingData.customInstructions,
        utrNumber: utrNumber.replace(/\s/g, ""),
        advanceAmount: ADVANCE_AMOUNT,
      });

      setIsSuccess(true);
      // Store booking ID and package details for confirmation page
      sessionStorage.setItem("confirmedBookingId", bookingId.toString());
      sessionStorage.setItem(
        "confirmedPackageName",
        selectedPackage?.name ?? "Selected Package",
      );
      sessionStorage.setItem("confirmedPackageAddOn", bookingData.addOn);
      sessionStorage.removeItem("bookingData");

      setTimeout(() => {
        navigate({ to: "/confirmation" });
      }, 800);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Booking failed. Please try again.",
      );
    }
  };

  if (!bookingData) return null;

  const addonLabel =
    bookingData.addOn === Variant_videoOnly_videoAndVoice.videoAndVoice
      ? "Video + Their Voice"
      : "Video Only";

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      {/* Header */}
      <header className="max-w-2xl mx-auto mb-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/book" })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Booking</span>
        </button>

        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-gold" />
            <span className="font-display font-semibold text-lg text-foreground">
              Unexpected<span className="text-gold">.Smile</span>
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-4">
            Complete Payment
          </h1>
          <p className="text-muted-foreground mt-2">
            Pay the ₹100 advance deposit to confirm your booking.
          </p>
        </motion.div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Order Summary */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-card rounded-2xl p-6 card-glow"
        >
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 border-b border-border pb-3">
            Order Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="text-foreground font-medium">
                {bookingData.clientName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span className="text-foreground font-medium">
                {selectedPackage?.name ?? bookingData.packageId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-On</span>
              <span className="text-foreground font-medium">{addonLabel}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-muted-foreground">Advance Deposit</span>
              <span className="font-display text-xl font-bold text-gold">
                ₹100/-
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60 text-right">
              Remaining balance due before production starts.
            </p>
          </div>
        </motion.div>

        {/* UPI Payment */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 card-glow"
        >
          <h2 className="font-display text-lg font-semibold text-foreground mb-6 border-b border-border pb-3">
            Pay via UPI
          </h2>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-5 mb-6">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-gold-sm ring-1 ring-gold/20">
                <img
                  src="/assets/uploads/image-1-2.png"
                  alt="UPI QR Code - Scan to Pay ₹100 Advance"
                  className="w-56 h-auto"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold text-primary-foreground text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                Scan to Pay ₹100 Advance
              </div>
            </div>

            {/* UPI ID */}
            <div className="mt-4 w-full">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                UPI ID
              </Label>
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl border border-border px-4 py-3">
                <code className="flex-1 text-gold font-mono text-sm">
                  {UPI_ID}
                </code>
                <Button
                  data-ocid="checkout.upi_copy_button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyUPI}
                  className="text-muted-foreground hover:text-gold h-8 w-8 p-0"
                >
                  {upiCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 bg-green-950/30 border border-green-800/30 rounded-xl px-4 py-3 mb-6">
            <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground">Need help with payment?</p>
              <a
                href={`https://wa.me/91${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 text-sm font-semibold hover:text-green-300 transition-colors"
              >
                WhatsApp: +91 {WHATSAPP_NUMBER}
              </a>
            </div>
          </div>

          {/* UTR Input */}
          <div className="space-y-2">
            <Label
              htmlFor="utrNumber"
              className="text-sm font-medium text-foreground"
            >
              Enter 12-digit UTR / Transaction Reference Number{" "}
              <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              After paying, copy the 12-digit UTR from your UPI app and paste it
              here.
            </p>
            <Input
              id="utrNumber"
              data-ocid="booking.utr_input"
              value={utrNumber}
              onChange={(e) => {
                setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12));
                if (utrError) setUtrError("");
              }}
              placeholder="123456789012"
              maxLength={12}
              className="bg-input border-border focus:border-gold font-mono text-base tracking-widest"
            />
            <div className="flex items-center justify-between">
              {utrError ? (
                <p
                  className="text-destructive text-xs"
                  data-ocid="checkout.error_state"
                >
                  {utrError}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {utrNumber.length}/12 digits
              </span>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-gold/50 flex-shrink-0 mt-0.5" />
            <span>
              Your UTR is used to verify your payment. Once verified by our
              admin, you'll receive a confirmation via WhatsApp.
            </span>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="pb-8"
        >
          {isSuccess ? (
            <div
              data-ocid="checkout.success_state"
              className="flex items-center justify-center gap-3 bg-green-950/40 border border-green-800/40 rounded-xl py-4 text-green-400"
            >
              <Check className="w-5 h-5" />
              <span className="font-semibold">
                Booking confirmed! Redirecting...
              </span>
            </div>
          ) : (
            <Button
              data-ocid="checkout.confirm_button"
              size="lg"
              className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-semibold text-base h-14"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2
                    className="mr-2 w-5 h-5 animate-spin"
                    data-ocid="checkout.loading_state"
                  />
                  Confirming Booking...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 w-5 h-5" />
                  Confirm Booking
                </>
              )}
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground mt-3">
            Your booking will be in "Pending Verification" until admin approves
            your payment.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
