import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  FileAudio,
  FileImage,
  Heart,
  Info,
  Loader2,
  MessageCircle,
  Search,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Booking } from "../backend.d";
import { BookingStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useBlobStorage } from "../hooks/useBlobStorage";
import {
  useGetClientMessages,
  useSendClientMessage,
} from "../hooks/useQueries";

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

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const variants: Record<BookingStatus, { label: string; className: string }> =
    {
      [BookingStatus.pendingVerification]: {
        label: "Pending Verification",
        className: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30",
      },
      [BookingStatus.approved]: {
        label: "Approved",
        className: "bg-blue-900/30 text-blue-400 border-blue-700/30",
      },
      [BookingStatus.completed]: {
        label: "Completed",
        className: "bg-green-900/30 text-green-400 border-green-700/30",
      },
      [BookingStatus.rejected]: {
        label: "Rejected",
        className: "bg-red-900/30 text-red-400 border-red-700/30",
      },
    };

  const v = variants[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${v.className}`}
    >
      {v.label}
    </span>
  );
}

interface UploadedFile {
  name: string;
  type: string;
  hash: string;
  size: number;
}

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const { uploadBlob, uploading, progress } = useBlobStorage();
  const fileRef = useRef<HTMLInputElement>(null);

  // Read bookingId from URL
  const searchParams = new URLSearchParams(window.location.search);
  const urlBookingId = searchParams.get("bookingId") ?? "";

  const [bookingIdInput, setBookingIdInput] = useState(urlBookingId);
  const [lookupId, setLookupId] = useState<bigint | null>(
    urlBookingId ? BigInt(urlBookingId) : null,
  );
  const [booking, setBooking] = useState<Booking | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [senderName, setSenderName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetClientMessages(lookupId);
  const { mutateAsync: sendMessage, isPending: sendingMessage } =
    useSendClientMessage();

  // Auto-lookup if URL param present (runs once when actor becomes available)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time lookup when actor is ready
  useEffect(() => {
    if (urlBookingId && actor) {
      handleLookup(urlBookingId);
    }
  }, [actor]);

  // Pre-fill name from booking
  useEffect(() => {
    if (booking?.clientName && !senderName) {
      setSenderName(booking.clientName);
    }
  }, [booking, senderName]);

  const handleLookup = async (idStr?: string) => {
    const idToLookup = idStr ?? bookingIdInput.trim();
    if (!idToLookup) {
      setLookupError("Please enter a Booking ID");
      return;
    }

    let idBig: bigint;
    try {
      idBig = BigInt(idToLookup);
    } catch {
      setLookupError("Invalid Booking ID — must be a number");
      return;
    }

    if (!actor) {
      setLookupError("System not ready yet, please try again");
      return;
    }

    setLookupLoading(true);
    setLookupError("");
    setBooking(null);
    try {
      const result = await actor.getBookingById(idBig);
      if (result) {
        setBooking(result);
        setLookupId(idBig);
        toast.success("Booking found!");
      } else {
        setLookupError(
          "No booking found with this ID. Please check and try again.",
        );
      }
    } catch {
      setLookupError("Failed to fetch booking. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId) return;

    if (!senderName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      await sendMessage({
        bookingId: lookupId,
        senderName: senderName.trim(),
        messageText: messageText.trim(),
      });
      setMessageText("");
      setMessageSent(true);
      refetchMessages();
      toast.success("Message sent successfully!");
      setTimeout(() => setMessageSent(false), 3000);
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const hash = await uploadBlob(file);
      if (hash) {
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, hash, size: file.size },
        ]);
        toast.success(`${file.name} uploaded successfully!`);
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gold/3 blur-3xl" />
      </div>

      {/* Header */}
      <header className="max-w-3xl mx-auto mb-10 relative">
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
            My Order Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Look up your order, send us a message, and upload your reference
            files.
          </p>
        </motion.div>
      </header>

      <div className="max-w-3xl mx-auto space-y-6 relative">
        {/* ─── Order Lookup ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-6 card-glow"
        >
          <h2 className="font-display text-lg font-semibold text-foreground mb-5 border-b border-border pb-3">
            Look Up Your Order
          </h2>

          <div className="space-y-3">
            <Label
              htmlFor="bookingId"
              className="text-sm font-medium text-foreground"
            >
              Booking Reference ID
            </Label>
            <div className="flex gap-3">
              <Input
                id="bookingId"
                data-ocid="client.booking_id_input"
                value={bookingIdInput}
                onChange={(e) => {
                  setBookingIdInput(e.target.value.replace(/\D/g, ""));
                  if (lookupError) setLookupError("");
                }}
                placeholder="Enter your booking ID number"
                className="bg-input border-border focus:border-gold font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <Button
                data-ocid="client.lookup_button"
                onClick={() => handleLookup()}
                disabled={lookupLoading || !bookingIdInput.trim()}
                className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold whitespace-nowrap"
              >
                {lookupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1.5" />
                    Look Up
                  </>
                )}
              </Button>
            </div>
            {lookupError && (
              <p
                data-ocid="client.error_state"
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 flex-shrink-0" />
                {lookupError}
              </p>
            )}
          </div>
        </motion.div>

        {/* ─── Order Details ────────────────────────────────── */}
        {lookupLoading && (
          <div className="bg-card rounded-2xl p-6 card-glow space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="client.order_card"
            className="bg-card rounded-2xl p-6 card-glow"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Order #{booking.id.toString()}
              </h2>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: "Client Name", value: booking.clientName },
                { label: "Email", value: booking.clientEmail },
                { label: "Phone", value: booking.clientPhone },
                {
                  label: "Advance Paid",
                  value: `₹${booking.advanceAmount.toLocaleString("en-IN")}`,
                },
                { label: "UTR Number", value: booking.utrNumber },
                {
                  label: "Submitted On",
                  value: formatDate(booking.createdAt),
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/20 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-foreground font-medium truncate">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {booking.adminNotes && (
              <div className="mt-4 bg-blue-900/15 border border-blue-700/25 rounded-xl p-4">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
                  Admin Note
                </p>
                <p className="text-sm text-foreground">{booking.adminNotes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Message Section ──────────────────────────────── */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 card-glow"
          >
            <h2 className="font-display text-lg font-semibold text-foreground mb-5 border-b border-border pb-3">
              <MessageCircle className="w-5 h-5 inline mr-2 text-gold" />
              Send Direct Message
            </h2>

            {/* Previous messages */}
            {messagesLoading ? (
              <div className="space-y-2 mb-5">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : messages && messages.length > 0 ? (
              <ScrollArea className="max-h-56 mb-5 pr-2">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id.toString()}
                      className="bg-muted/30 rounded-xl p-4 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-foreground">
                          {msg.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {msg.messageText}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : null}

            {/* Message form */}
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="senderName"
                  className="text-sm font-medium text-foreground"
                >
                  Your Name
                </Label>
                <Input
                  id="senderName"
                  data-ocid="client.message_input"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-input border-border focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="messageText"
                  className="text-sm font-medium text-foreground"
                >
                  Message
                </Label>
                <Textarea
                  id="messageText"
                  data-ocid="client.message_textarea"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Additional instructions, special requests, emotional details you'd like to share..."
                  className="min-h-[120px] bg-input border-border focus:border-gold resize-none"
                />
              </div>

              {messageSent && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-ocid="client.message_success_state"
                  className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-2.5"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Message sent! Our team will review it shortly.
                </motion.div>
              )}

              <Button
                type="submit"
                data-ocid="client.message_submit_button"
                disabled={
                  sendingMessage || !messageText.trim() || !senderName.trim()
                }
                className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {/* ─── File Upload Section ──────────────────────────── */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl p-6 card-glow"
          >
            <h2 className="font-display text-lg font-semibold text-foreground mb-2 border-b border-border pb-3">
              <Upload className="w-5 h-5 inline mr-2 text-gold" />
              Upload Reference Files
            </h2>

            <div className="flex items-start gap-2 text-xs text-muted-foreground mb-5 mt-3 bg-gold/5 border border-gold/15 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <span>
                Files are linked to your Order ID{" "}
                <strong className="text-gold">#{booking.id.toString()}</strong>{" "}
                and visible to our team. Please upload your reference photos and
                audio clips here.
              </span>
            </div>

            {/* Upload zone */}
            <button
              type="button"
              data-ocid="client.upload_button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-border hover:border-gold/40 rounded-xl p-8 text-center transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 text-gold mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Uploading... {progress}%
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mx-auto max-w-xs">
                    <div
                      className="h-full bg-gold rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gold/50 mx-auto" />
                  <p className="text-sm text-foreground font-medium">
                    Click to upload photos or audio
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, MP3, WAV, M4A supported
                  </p>
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                  Uploaded Files ({uploadedFiles.length})
                </p>
                {uploadedFiles.map((file, i) => (
                  <div
                    key={`${file.hash}-${i}`}
                    className="flex items-center gap-3 bg-muted/20 rounded-lg px-4 py-3 border border-border/50"
                  >
                    {file.type.startsWith("audio/") ? (
                      <FileAudio className="w-4 h-4 text-gold/60 flex-shrink-0" />
                    ) : (
                      <FileImage className="w-4 h-4 text-gold/60 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Help prompt when no booking found yet ─────── */}
        {!booking && !lookupLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Clock className="w-10 h-10 mx-auto mb-3 text-gold/20" />
            <p className="text-sm">
              Enter your Booking ID above to access your order details,
              messaging, and file uploads.
            </p>
            <p className="text-xs mt-2 text-muted-foreground/60">
              Your Booking ID was shown on the confirmation page after checkout.
            </p>
          </motion.div>
        )}

        {/* Footer padding */}
        <div className="pb-8" />
      </div>
    </div>
  );
}
