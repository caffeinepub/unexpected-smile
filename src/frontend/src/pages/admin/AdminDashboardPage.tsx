import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Film,
  Globe,
  Heart,
  IndianRupee,
  ListOrdered,
  Loader2,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  Booking,
  ClientMessage,
  PortfolioEntry,
  PortfolioEntryInput,
} from "../../backend.d";
import {
  BookingStatus,
  Variant_videoOnly_videoAndVoice,
} from "../../backend.d";
import { useAuth } from "../../hooks/useAuth";
import { useBlobStorage } from "../../hooks/useBlobStorage";
import {
  useCreatePortfolioEntry,
  useDeletePortfolioEntry,
  useGetAllClientMessages,
  useGetAllPortfolioEntries,
  useGetBookings,
  useGetPackages,
  useSeedPortfolioEntries,
  useUpdateBookingStatus,
  useUpdatePortfolioEntry,
} from "../../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: bigint): string {
  return price.toLocaleString("en-IN");
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const variants: Record<BookingStatus, { label: string; className: string }> =
    {
      [BookingStatus.pendingVerification]: {
        label: "Pending",
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
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${v.className}`}
    >
      {v.label}
    </span>
  );
}

// ─── Portfolio Form ───────────────────────────────────────────────────────────

interface PortfolioFormState {
  title: string;
  description: string;
  embedUrl: string;
  isPublished: boolean;
  sortOrder: string;
}

function PortfolioEntrySheet({
  open,
  onClose,
  editEntry,
}: {
  open: boolean;
  onClose: () => void;
  editEntry: PortfolioEntry | null;
}) {
  const { uploadBlob, uploading, progress } = useBlobStorage();
  const { mutateAsync: createEntry, isPending: isCreating } =
    useCreatePortfolioEntry();
  const { mutateAsync: updateEntry, isPending: isUpdating } =
    useUpdatePortfolioEntry();

  const thumbnailRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PortfolioFormState>({
    title: "",
    description: "",
    embedUrl: "",
    isPublished: true,
    sortOrder: "0",
  });
  const [thumbnailId, setThumbnailId] = useState<string | undefined>(undefined);

  // Reset form when sheet opens/closes or editEntry changes
  useEffect(() => {
    if (editEntry) {
      setForm({
        title: editEntry.title,
        description: editEntry.description,
        embedUrl: editEntry.embedUrl ?? "",
        isPublished: editEntry.isPublished,
        sortOrder: editEntry.sortOrder.toString(),
      });
      setThumbnailId(editEntry.thumbnailBlobId);
    } else {
      setForm({
        title: "",
        description: "",
        embedUrl: "",
        isPublished: true,
        sortOrder: "0",
      });
      setThumbnailId(undefined);
    }
  }, [editEntry]);

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const hash = await uploadBlob(file);
    if (hash) {
      setThumbnailId(hash);
      toast.success("Thumbnail uploaded!");
    } else {
      toast.error("Thumbnail upload failed");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const input: PortfolioEntryInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      embedUrl: form.embedUrl.trim() || undefined,
      isPublished: form.isPublished,
      sortOrder: BigInt(Number(form.sortOrder) || 0),
      thumbnailBlobId: thumbnailId,
    };
    try {
      if (editEntry) {
        await updateEntry({ id: editEntry.id, input });
        toast.success("Portfolio entry updated!");
      } else {
        await createEntry(input);
        toast.success("Portfolio entry created!");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-card border-border"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl font-semibold text-foreground">
            {editEntry ? "Edit Portfolio Entry" : "Add Portfolio Entry"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-160px)] pr-1">
          <div className="space-y-5 pb-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="admin.entry_title_input"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Tribute title..."
                className="bg-input border-border focus:border-gold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                data-ocid="admin.entry_description_textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="A heartfelt description of this tribute..."
                className="min-h-[100px] bg-input border-border focus:border-gold resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Embed URL (YouTube / Instagram)
              </Label>
              <Input
                data-ocid="admin.entry_embed_url_input"
                value={form.embedUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, embedUrl: e.target.value }))
                }
                placeholder="https://www.youtube.com/embed/..."
                className="bg-input border-border focus:border-gold"
              />
              <p className="text-xs text-muted-foreground">
                Use the embed URL (not share URL) for YouTube/Instagram.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Thumbnail Image
              </Label>
              <button
                type="button"
                className="w-full border border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-gold/40 transition-colors"
                onClick={() => thumbnailRef.current?.click()}
                data-ocid="admin.portfolio_dropzone"
              >
                {thumbnailId ? (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Thumbnail uploaded
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Click to upload thumbnail</p>
                    <p className="text-xs mt-1">PNG, JPG, WebP</p>
                  </div>
                )}
                {uploading && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploading... {progress}%
                    </p>
                  </div>
                )}
              </button>
              <input
                ref={thumbnailRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-ocid="admin.upload_button"
                onChange={handleThumbnailUpload}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Sort Order
              </Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sortOrder: e.target.value }))
                }
                placeholder="0"
                className="bg-input border-border focus:border-gold"
              />
            </div>

            <div className="flex items-center justify-between py-3 border border-border rounded-xl px-4">
              <div>
                <p className="text-sm font-medium text-foreground">Published</p>
                <p className="text-xs text-muted-foreground">
                  Visible on the public gallery
                </p>
              </div>
              <Switch
                data-ocid="admin.entry_published_switch"
                checked={form.isPublished}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isPublished: v }))
                }
              />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground"
            data-ocid="admin.entry_cancel_button"
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.entry_save_button"
            onClick={handleSave}
            disabled={isSaving || uploading}
            className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : editEntry ? (
              "Save Changes"
            ) : (
              "Create Entry"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Order Details Sheet ──────────────────────────────────────────────────────

function OrderDetailsSheet({
  booking,
  onClose,
  onStatusUpdate,
  isUpdating,
}: {
  booking: Booking | null;
  onClose: () => void;
  onStatusUpdate: (status: BookingStatus, notes: string | null) => void;
  isUpdating: boolean;
}) {
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (booking) {
      setAdminNotes(booking.adminNotes ?? "");
    }
  }, [booking]);

  if (!booking) return null;

  const addonLabel =
    booking.addOn === Variant_videoOnly_videoAndVoice.videoAndVoice
      ? "Video + Their Voice"
      : "Video Only";

  return (
    <Sheet open={!!booking} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-card border-border"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl font-semibold text-foreground">
            Order #{booking.id.toString()}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-160px)] pr-1">
          <div className="space-y-5 pb-6">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={booking.status} />
            </div>

            {/* Client Info */}
            <div className="bg-muted/20 rounded-xl p-4 space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Client Details
              </h3>
              {[
                { label: "Name", value: booking.clientName },
                { label: "Email", value: booking.clientEmail },
                { label: "Phone", value: booking.clientPhone },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Booking Info */}
            <div className="bg-muted/20 rounded-xl p-4 space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Booking Details
              </h3>
              {[
                {
                  label: "Package ID",
                  value: booking.packageId.toString(),
                },
                { label: "Add-On", value: addonLabel },
                {
                  label: "Advance",
                  value: `₹${formatPrice(booking.advanceAmount)}`,
                },
                { label: "UTR Number", value: booking.utrNumber },
                { label: "Date", value: formatDate(booking.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium font-mono text-xs">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Custom Instructions */}
            {booking.customInstructions && (
              <div className="bg-muted/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Custom Instructions
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {booking.customInstructions}
                </p>
              </div>
            )}

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Admin Notes
              </Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this booking..."
                className="min-h-[80px] bg-input border-border focus:border-gold resize-none text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {booking.status === BookingStatus.pendingVerification && (
                <>
                  <Button
                    data-ocid="admin.order_approve_button.1"
                    className="w-full bg-blue-800/20 hover:bg-blue-800/30 border border-blue-700/30 text-blue-400"
                    variant="outline"
                    onClick={() =>
                      onStatusUpdate(BookingStatus.approved, adminNotes || null)
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 w-4 h-4" />
                    )}
                    Approve Booking
                  </Button>
                  <Button
                    data-ocid="admin.order_reject_button.1"
                    className="w-full bg-red-900/20 hover:bg-red-900/30 border border-red-800/30 text-red-400"
                    variant="outline"
                    onClick={() =>
                      onStatusUpdate(BookingStatus.rejected, adminNotes || null)
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : (
                      <X className="mr-2 w-4 h-4" />
                    )}
                    Reject Booking
                  </Button>
                </>
              )}
              {booking.status === BookingStatus.approved && (
                <Button
                  data-ocid="admin.order_complete_button.1"
                  className="w-full bg-green-900/20 hover:bg-green-900/30 border border-green-800/30 text-green-400"
                  variant="outline"
                  onClick={() =>
                    onStatusUpdate(BookingStatus.completed, adminNotes || null)
                  }
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 w-4 h-4" />
                  )}
                  Mark as Completed
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: packages } = useGetPackages();

  const [activeTab, setActiveTab] = useState("orders");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [portfolioSheetOpen, setPortfolioSheetOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PortfolioEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Data hooks
  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetBookings(statusFilter);
  const { data: portfolio, isLoading: portfolioLoading } =
    useGetAllPortfolioEntries();
  const { data: allMessages, isLoading: messagesLoading } =
    useGetAllClientMessages();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateBookingStatus();
  const { mutateAsync: deleteEntry } = useDeletePortfolioEntry();
  const { mutateAsync: seedEntries, isPending: isSeeding } =
    useSeedPortfolioEntries();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
    }
  }, [isAuthenticated, navigate]);

  // Seed portfolio on first load if empty
  useEffect(() => {
    if (!seeded && portfolio && portfolio.length === 0 && !portfolioLoading) {
      setSeeded(true);
      seedEntries()
        .then(() => {
          toast.success("Sample portfolio entries loaded!");
        })
        .catch(() => {
          // Ignore seed errors silently
        });
    }
  }, [portfolio, portfolioLoading, seedEntries, seeded]);

  const handleStatusUpdate = async (
    status: BookingStatus,
    notes: string | null,
  ) => {
    if (!selectedBooking) return;
    try {
      await updateStatus({ id: selectedBooking.id, status, adminNotes: notes });
      toast.success(
        `Booking ${status === BookingStatus.approved ? "approved" : status === BookingStatus.rejected ? "rejected" : "completed"}!`,
      );
      setSelectedBooking(null);
      refetchBookings();
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  const handleDeleteEntry = async (id: bigint) => {
    try {
      await deleteEntry(id);
      toast.success("Entry deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const statusFilters: { label: string; value: BookingStatus | null }[] = [
    { label: "All", value: null },
    { label: "Pending", value: BookingStatus.pendingVerification },
    { label: "Approved", value: BookingStatus.approved },
    { label: "Completed", value: BookingStatus.completed },
    { label: "Rejected", value: BookingStatus.rejected },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold" />
            <span className="font-display font-semibold text-lg text-foreground">
              Unexpected<span className="text-gold">.Smile</span>
            </span>
            <span className="ml-2 text-xs bg-gold/10 border border-gold/20 text-gold px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-6">
            Dashboard
          </h1>

          {/* ─── Analytics Overview ─────────────────────── */}
          {(() => {
            const allBookings = bookings ?? [];
            const totalOrders = allBookings.length;
            const pendingVerifications = allBookings.filter(
              (b) => b.status === BookingStatus.pendingVerification,
            ).length;
            const totalRevenue = allBookings
              .filter((b) => b.status !== BookingStatus.rejected)
              .reduce((sum, b) => sum + Number(b.advanceAmount), 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* Total Orders */}
                <div
                  data-ocid="admin.analytics_total_orders_card"
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 card-glow"
                >
                  <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Total Orders
                    </p>
                    {bookingsLoading ? (
                      <div className="h-7 w-10 bg-muted rounded animate-pulse mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground font-display">
                        {totalOrders}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pending UPI Verifications */}
                <div
                  data-ocid="admin.analytics_pending_card"
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 card-glow"
                >
                  <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Pending Verifications
                    </p>
                    {bookingsLoading ? (
                      <div className="h-7 w-10 bg-muted rounded animate-pulse mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-yellow-400 font-display">
                        {pendingVerifications}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Revenue */}
                <div
                  data-ocid="admin.analytics_revenue_card"
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 card-glow"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Total Revenue
                    </p>
                    {bookingsLoading ? (
                      <div className="h-7 w-20 bg-muted rounded animate-pulse mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-green-400 font-display">
                        ₹{totalRevenue.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-card border border-border">
              <TabsTrigger
                data-ocid="admin.orders_tab"
                value="orders"
                className="flex items-center gap-2"
              >
                <ListOrdered className="w-4 h-4" />
                Orders
                {bookings && bookings.length > 0 && (
                  <span className="ml-1 bg-gold/20 text-gold text-xs px-1.5 py-0.5 rounded-full">
                    {bookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.portfolio_tab"
                value="portfolio"
                className="flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.messages_tab"
                value="messages"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Messages
                {allMessages && allMessages.length > 0 && (
                  <span className="ml-1 bg-blue-500/20 text-blue-400 text-xs px-1.5 py-0.5 rounded-full">
                    {allMessages.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── Orders Tab ─────────────────────────────── */}
            <TabsContent value="orders" className="space-y-5">
              {/* Status filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {statusFilters.map((f) => (
                  <button
                    type="button"
                    key={f.label}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === f.value
                        ? "bg-gold text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-gold/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refetchBookings()}
                  className="ml-auto text-muted-foreground"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Orders Table */}
              {bookingsLoading ? (
                <div className="space-y-2">
                  {[
                    "row-sk-1",
                    "row-sk-2",
                    "row-sk-3",
                    "row-sk-4",
                    "row-sk-5",
                  ].map((id) => (
                    <Skeleton key={id} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : !bookings || bookings.length === 0 ? (
                <div
                  data-ocid="admin.orders_empty_state"
                  className="text-center py-16 rounded-xl border border-dashed border-border"
                >
                  <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden border border-border"
                  data-ocid="admin.orders_table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent bg-muted/10">
                        <TableHead className="text-muted-foreground text-xs font-semibold">
                          Client Name
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold hidden sm:table-cell">
                          Selected Package
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold hidden md:table-cell">
                          UPI UTR Number
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold hidden lg:table-cell">
                          Custom Instructions
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking, i) => {
                        const pkg = packages?.find(
                          (p) => p.id === booking.packageId,
                        );
                        const pkgName =
                          pkg?.name ??
                          `Package #${booking.packageId.toString()}`;
                        const addonSuffix =
                          booking.addOn ===
                          Variant_videoOnly_videoAndVoice.videoAndVoice
                            ? " + Voice"
                            : "";
                        return (
                          <TableRow
                            key={booking.id.toString()}
                            data-ocid={`admin.order_row.${i + 1}`}
                            className="border-border hover:bg-muted/20 transition-colors"
                          >
                            {/* Client Name */}
                            <TableCell>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {booking.clientName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.clientPhone}
                                </p>
                              </div>
                            </TableCell>

                            {/* Selected Package */}
                            <TableCell className="hidden sm:table-cell">
                              <div>
                                <p className="text-sm text-foreground font-medium leading-tight">
                                  {pkgName}
                                </p>
                                <p className="text-xs text-gold/70 mt-0.5">
                                  ₹
                                  {pkg
                                    ? booking.addOn ===
                                      Variant_videoOnly_videoAndVoice.videoAndVoice
                                      ? Number(
                                          pkg.voiceAddonPrice,
                                        ).toLocaleString("en-IN")
                                      : Number(
                                          pkg.videoOnlyPrice,
                                        ).toLocaleString("en-IN")
                                    : "—"}
                                  {addonSuffix}
                                </p>
                              </div>
                            </TableCell>

                            {/* UTR Number */}
                            <TableCell className="hidden md:table-cell">
                              <code className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                                {booking.utrNumber}
                              </code>
                            </TableCell>

                            {/* Custom Instructions (truncated) */}
                            <TableCell className="hidden lg:table-cell max-w-[200px]">
                              <p
                                className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
                                title={booking.customInstructions}
                              >
                                {booking.customInstructions || (
                                  <span className="opacity-40 italic">
                                    None
                                  </span>
                                )}
                              </p>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <StatusBadge status={booking.status} />
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  data-ocid={`admin.order_view_button.${i + 1}`}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  title="View details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                {booking.status ===
                                  BookingStatus.pendingVerification && (
                                  <>
                                    <Button
                                      data-ocid={`admin.order_approve_button.${i + 1}`}
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                      }}
                                      className="h-7 px-2 text-xs border-blue-700/40 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Approve
                                    </Button>
                                    <Button
                                      data-ocid={`admin.order_reject_button.${i + 1}`}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                      }}
                                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                      title="Reject"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                {booking.status === BookingStatus.approved && (
                                  <Button
                                    data-ocid={`admin.order_complete_button.${i + 1}`}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                    }}
                                    className="h-7 px-2 text-xs border-green-700/40 text-green-400 hover:bg-green-900/20 hover:text-green-300 gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ─── Portfolio Tab ──────────────────────────── */}
            <TabsContent value="portfolio" className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Portfolio Entries
                </h2>
                <Button
                  data-ocid="admin.portfolio_add_button"
                  onClick={() => {
                    setEditEntry(null);
                    setPortfolioSheetOpen(true);
                  }}
                  className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
                  size="sm"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add Entry
                </Button>
              </div>

              {portfolioLoading || isSeeding ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["port-sk-1", "port-sk-2", "port-sk-3"].map((id) => (
                    <Skeleton key={id} className="h-48 w-full rounded-xl" />
                  ))}
                </div>
              ) : !portfolio || portfolio.length === 0 ? (
                <div
                  data-ocid="admin.portfolio_empty_state"
                  className="text-center py-16 rounded-xl border border-dashed border-border"
                >
                  <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No portfolio entries yet
                  </p>
                  <Button
                    className="mt-4 bg-gold text-primary-foreground hover:bg-gold-light"
                    size="sm"
                    onClick={() => {
                      setEditEntry(null);
                      setPortfolioSheetOpen(true);
                    }}
                  >
                    Add First Entry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((entry, i) => (
                    <div
                      key={entry.id.toString()}
                      data-ocid={`admin.portfolio_item.${i + 1}`}
                      className="bg-card rounded-xl border border-border overflow-hidden card-glow"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-muted relative">
                        {entry.thumbnailBlobId ? (
                          <img
                            src={entry.thumbnailBlobId}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Published badge */}
                        <div className="absolute top-2 right-2">
                          {entry.isPublished ? (
                            <Globe className="w-4 h-4 text-green-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-medium text-foreground text-sm line-clamp-1">
                          {entry.title}
                        </h3>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {entry.description}
                          </p>
                        )}
                        {entry.embedUrl && (
                          <p className="text-xs text-gold/60 mt-1 line-clamp-1">
                            {entry.embedUrl}
                          </p>
                        )}
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            data-ocid={`admin.portfolio_edit_button.${i + 1}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditEntry(entry);
                              setPortfolioSheetOpen(true);
                            }}
                            className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            data-ocid={`admin.portfolio_delete_button.${i + 1}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="flex-1 h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Messages Tab ──────────────────────────────── */}
            <TabsContent value="messages" className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Client Messages
                </h2>
              </div>

              {messagesLoading ? (
                <div className="space-y-3">
                  {["msg-sk-1", "msg-sk-2", "msg-sk-3"].map((id) => (
                    <div
                      key={id}
                      className="bg-card rounded-xl p-5 border border-border"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                      </div>
                      <div className="h-3 w-full bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : !allMessages || allMessages.length === 0 ? (
                <div
                  data-ocid="admin.messages_empty_state"
                  className="text-center py-16 rounded-xl border border-dashed border-border"
                >
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No client messages yet
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Messages sent by clients will appear here, grouped by
                    booking.
                  </p>
                </div>
              ) : (
                (() => {
                  // Group by bookingId
                  const grouped = allMessages.reduce(
                    (acc, msg) => {
                      const key = msg.bookingId.toString();
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(msg);
                      return acc;
                    },
                    {} as Record<string, ClientMessage[]>,
                  );

                  return (
                    <div data-ocid="admin.messages_table" className="space-y-5">
                      {Object.entries(grouped).map(([bookingIdStr, msgs]) => (
                        <div
                          key={bookingIdStr}
                          className="bg-card rounded-xl border border-border overflow-hidden"
                        >
                          {/* Booking header */}
                          <div className="bg-muted/20 px-5 py-3 border-b border-border flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-gold/60" />
                            <span className="font-mono text-sm text-muted-foreground">
                              Booking ID:{" "}
                              <span className="text-gold font-semibold">
                                #{bookingIdStr}
                              </span>
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded-full">
                              {msgs.length} message
                              {msgs.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Messages */}
                          <div className="divide-y divide-border/50">
                            {msgs
                              .sort(
                                (a, b) =>
                                  Number(a.createdAt) - Number(b.createdAt),
                              )
                              .map((msg) => (
                                <div
                                  key={msg.id.toString()}
                                  className="px-5 py-4"
                                >
                                  <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <span className="font-semibold text-sm text-foreground">
                                      {msg.senderName}
                                    </span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {new Date(
                                        Number(msg.createdAt) / 1_000_000,
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {msg.messageText}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Portfolio Sheet */}
      <PortfolioEntrySheet
        open={portfolioSheetOpen}
        onClose={() => {
          setPortfolioSheetOpen(false);
          setEditEntry(null);
        }}
        editEntry={editEntry}
      />

      {/* Order Details Sheet */}
      <OrderDetailsSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Delete Portfolio Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.portfolio_delete_cancel_button"
              className="border-border text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.portfolio_delete_confirm_button"
              onClick={() =>
                deleteConfirm !== null && handleDeleteEntry(deleteConfirm)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
