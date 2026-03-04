import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Film, Heart, Mic, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Variant_videoOnly_videoAndVoice } from "../backend.d";
import type { Package } from "../backend.d";
import { useGetPackages } from "../hooks/useQueries";

interface BookingFormData {
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

function formatPrice(price: bigint): string {
  return price.toLocaleString("en-IN");
}

export default function BookingPage() {
  const navigate = useNavigate();
  const { data: packages, isLoading } = useGetPackages();

  // Get packageId from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedPackageId = searchParams.get("packageId") ?? "";

  const [form, setForm] = useState<BookingFormData>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    packageId: preselectedPackageId,
    addOn: Variant_videoOnly_videoAndVoice.videoOnly,
    customInstructions: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingFormData, string>>
  >({});

  // Auto-select preloaded package
  useEffect(() => {
    if (preselectedPackageId && !form.packageId) {
      setForm((prev) => ({ ...prev, packageId: preselectedPackageId }));
    }
  }, [preselectedPackageId, form.packageId]);

  const selectedPackage: Package | undefined = packages?.find(
    (p) => p.id.toString() === form.packageId,
  );

  const currentPrice = selectedPackage
    ? form.addOn === Variant_videoOnly_videoAndVoice.videoOnly
      ? selectedPackage.videoOnlyPrice
      : selectedPackage.voiceAddonPrice
    : null;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (!form.clientName.trim()) newErrors.clientName = "Name is required";
    if (!form.clientEmail.trim()) newErrors.clientEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail))
      newErrors.clientEmail = "Enter a valid email";
    if (!form.clientPhone.trim()) newErrors.clientPhone = "Phone is required";
    else if (!/^\d{10}$/.test(form.clientPhone.replace(/\s/g, "")))
      newErrors.clientPhone = "Enter a valid 10-digit phone number";
    if (!form.packageId) newErrors.packageId = "Please select a package";
    if (!form.customInstructions.trim())
      newErrors.customInstructions =
        "Please provide your instructions and suggestions";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Store form data in sessionStorage for checkout page
    sessionStorage.setItem("bookingData", JSON.stringify(form));
    navigate({ to: "/checkout" });
  };

  const updateField = <K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      {/* Header */}
      <header className="max-w-3xl mx-auto mb-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-gold" />
            <span className="font-display font-semibold text-lg text-foreground">
              Unexpected<span className="text-gold">.Smile</span>
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-4">
            Book Your Tribute
          </h1>
          <p className="text-muted-foreground mt-2">
            Share the details and we'll create a deeply emotional memorial
            video.
          </p>
        </motion.div>
      </header>

      <div className="max-w-3xl mx-auto">
        <motion.form
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-8"
        >
          {/* Personal Details */}
          <motion.div
            variants={fadeUp}
            className="bg-card rounded-2xl p-6 sm:p-8 card-glow space-y-5"
          >
            <h2 className="font-display text-xl font-semibold text-foreground border-b border-border pb-4">
              Your Details
            </h2>

            <div className="space-y-1.5">
              <Label
                htmlFor="clientName"
                className="text-sm font-medium text-foreground"
              >
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                data-ocid="booking.name_input"
                value={form.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                placeholder="Your full name"
                className="bg-input border-border focus:border-gold"
              />
              {errors.clientName && (
                <p className="text-destructive text-xs mt-1">
                  {errors.clientName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="clientEmail"
                className="text-sm font-medium text-foreground"
              >
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientEmail"
                data-ocid="booking.email_input"
                type="email"
                value={form.clientEmail}
                onChange={(e) => updateField("clientEmail", e.target.value)}
                placeholder="you@example.com"
                className="bg-input border-border focus:border-gold"
              />
              {errors.clientEmail && (
                <p className="text-destructive text-xs mt-1">
                  {errors.clientEmail}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="clientPhone"
                className="text-sm font-medium text-foreground"
              >
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientPhone"
                data-ocid="booking.phone_input"
                type="tel"
                value={form.clientPhone}
                onChange={(e) => updateField("clientPhone", e.target.value)}
                placeholder="10-digit mobile number"
                className="bg-input border-border focus:border-gold"
              />
              {errors.clientPhone && (
                <p className="text-destructive text-xs mt-1">
                  {errors.clientPhone}
                </p>
              )}
            </div>
          </motion.div>

          {/* Package Selection */}
          <motion.div
            variants={fadeUp}
            className="bg-card rounded-2xl p-6 sm:p-8 card-glow space-y-5"
          >
            <h2 className="font-display text-xl font-semibold text-foreground border-b border-border pb-4">
              Select Package
            </h2>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Package <span className="text-destructive">*</span>
              </Label>
              {isLoading ? (
                <div className="h-10 bg-muted rounded-md animate-pulse" />
              ) : (
                <Select
                  value={form.packageId}
                  onValueChange={(val) => updateField("packageId", val)}
                >
                  <SelectTrigger
                    data-ocid="booking.package_select"
                    className="bg-input border-border focus:border-gold"
                  >
                    <SelectValue placeholder="Choose a package..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(packages ?? []).map((pkg) => (
                      <SelectItem
                        key={pkg.id.toString()}
                        value={pkg.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <span>{pkg.name}</span>
                          {pkg.isBestSeller && (
                            <span className="text-xs bg-gold/20 text-gold px-1.5 rounded">
                              Best Seller
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.packageId && (
                <p className="text-destructive text-xs mt-1">
                  {errors.packageId}
                </p>
              )}
            </div>

            {/* Selected package details */}
            {selectedPackage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-muted/50 rounded-xl p-4 border border-border"
              >
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-gold/60" />
                    {selectedPackage.durationDescription}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gold/60" />
                    {selectedPackage.memberDetails}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Add-on selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Add-On Option <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                data-ocid="booking.addon_radio"
                value={form.addOn}
                onValueChange={(val) =>
                  updateField("addOn", val as Variant_videoOnly_videoAndVoice)
                }
                className="space-y-3"
              >
                <label
                  htmlFor="addon-video-only"
                  className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                    form.addOn === Variant_videoOnly_videoAndVoice.videoOnly
                      ? "border-gold/50 bg-gold/5"
                      : "border-border hover:border-gold/20"
                  }`}
                >
                  <RadioGroupItem
                    id="addon-video-only"
                    value={Variant_videoOnly_videoAndVoice.videoOnly}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-gold/60" />
                      <span className="font-medium text-foreground text-sm">
                        Video Only
                      </span>
                    </div>
                    {selectedPackage && (
                      <p className="text-gold text-sm font-semibold mt-0.5">
                        ₹{formatPrice(selectedPackage.videoOnlyPrice)}/-
                      </p>
                    )}
                  </div>
                </label>

                <label
                  htmlFor="addon-voice"
                  className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                    form.addOn === Variant_videoOnly_videoAndVoice.videoAndVoice
                      ? "border-gold/50 bg-gold/5"
                      : "border-border hover:border-gold/20"
                  }`}
                >
                  <RadioGroupItem
                    id="addon-voice"
                    value={Variant_videoOnly_videoAndVoice.videoAndVoice}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-gold/60" />
                      <span className="font-medium text-foreground text-sm">
                        Video + Their Voice
                      </span>
                      <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    {selectedPackage && (
                      <p className="text-gold text-sm font-semibold mt-0.5">
                        ₹{formatPrice(selectedPackage.voiceAddonPrice)}/-
                      </p>
                    )}
                    <p className="text-muted-foreground/70 text-xs mt-0.5 italic">
                      "Creates the most realistic experience as if they are
                      speaking again."
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Price summary */}
            {currentPrice !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between bg-gold/8 border border-gold/25 rounded-xl px-5 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  Package Total
                </span>
                <span className="font-display text-xl font-bold text-gold">
                  ₹{formatPrice(currentPrice)}/-
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Custom Instructions */}
          <motion.div
            variants={fadeUp}
            className="bg-card rounded-2xl p-6 sm:p-8 card-glow space-y-4"
          >
            <h2 className="font-display text-xl font-semibold text-foreground border-b border-border pb-4">
              Your Vision
            </h2>

            <div className="space-y-1.5">
              <Label
                htmlFor="customInstructions"
                className="text-sm font-medium text-foreground"
              >
                Custom Instructions & Suggestions{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Help us understand your loved one — their personality, your
                relationship, cherished memories, and what you'd like captured
                in the video.
              </p>
              <Textarea
                id="customInstructions"
                data-ocid="booking.instructions_textarea"
                value={form.customInstructions}
                onChange={(e) =>
                  updateField("customInstructions", e.target.value)
                }
                placeholder="Describe the relationship, memories, emotional tone, specific requests..."
                className="min-h-[160px] bg-input border-border focus:border-gold resize-none"
              />
              {errors.customInstructions && (
                <p className="text-destructive text-xs mt-1">
                  {errors.customInstructions}
                </p>
              )}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp} className="pb-8">
            <Button
              type="submit"
              data-ocid="booking.submit_button"
              size="lg"
              className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-semibold text-base h-14"
            >
              Proceed to Payment
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Only ₹100 advance required to confirm your booking.
            </p>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
