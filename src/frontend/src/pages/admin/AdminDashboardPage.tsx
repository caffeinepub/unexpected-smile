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
  ChevronDown,
  ChevronUp,
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
  Package,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  Star,
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
  PackageId,
  PackageInput,
  Package as PackageType,
  PortfolioEntry,
  PortfolioEntryInput,
} from "../../backend.d";
import {
  BookingStatus,
  ReorderDirection,
  Variant_videoOnly_videoAndVoice,
} from "../../backend.d";
import { useAuth } from "../../hooks/useAuth";
import { useBlobStorage } from "../../hooks/useBlobStorage";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useCreatePackage,
  useCreatePortfolioEntry,
  useDeletePackage,
  useDeletePortfolioEntry,
  useGetAllClientMessages,
  useGetAllPackages,
  useGetAllPortfolioEntries,
  useGetBookings,
  useGetPackages,
  useReorderPortfolioEntry,
  useSeedPortfolioEntries,
  useUpdateBookingStatus,
  useUpdatePackage,
  useUpdatePortfolioEntry,
} from "../../hooks/useQueries";

// ─── BlobImage ─────────────────────────────────────────────────────────────────
// Resolves a blob hash to a working URL via getBlobURL.

function AdminBlobImage({
  blobId,
  alt,
  className,
}: {
  blobId: string;
  alt: string;
  className?: string;
}) {
  const { getBlobURL } = useBlobStorage();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBlobURL(blobId).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [blobId, getBlobURL]);

  if (!url) {
    return (
      <div
        className={`bg-muted/40 flex items-center justify-center ${className ?? "w-full h-full"}`}
      >
        <Film className="w-6 h-6 text-muted-foreground/30" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className ?? "w-full h-full object-cover"}
    />
  );
}

// ─── Reviews CMS ──────────────────────────────────────────────────────────────

const APPROVED_REVIEWS_KEY = "us_approved_reviews";

const STATIC_REVIEWS = [
  {
    id: 0,
    name: "Priya Sharma",
    location: "Hyderabad",
    event: "Wedding Tribute",
    rating: 5,
    text: "We were in tears when we saw the video. My father-in-law who passed away last year was there at the wedding in spirit, and seeing him speak again — it felt like a miracle. UNEXPECTED.SMILE gave us a gift we will treasure forever.",
  },
  {
    id: 1,
    name: "Rajesh Kumar",
    location: "Bangalore",
    event: "Birthday Surprise",
    rating: 5,
    text: "My mother's 60th birthday was made extraordinary. We had a tribute video of my late grandfather blessing her. The quality of the AI recreation was unbelievably realistic — everyone was moved deeply. Truly worth every rupee.",
  },
  {
    id: 2,
    name: "Ananya Reddy",
    location: "Chennai",
    event: "Family Reunion",
    rating: 5,
    text: "The team was incredibly sensitive and professional. They recreated my grandmother's smile and voice perfectly. This was our family's most emotional and beautiful moment. I cannot recommend UNEXPECTED.SMILE enough.",
  },
] as const;

function getApprovedIds(): number[] {
  try {
    const stored = localStorage.getItem(APPROVED_REVIEWS_KEY);
    if (!stored) return STATIC_REVIEWS.map((r) => r.id);
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed as number[];
    return STATIC_REVIEWS.map((r) => r.id);
  } catch {
    return STATIC_REVIEWS.map((r) => r.id);
  }
}

function saveApprovedIds(ids: number[]) {
  localStorage.setItem(APPROVED_REVIEWS_KEY, JSON.stringify(ids));
  // Dispatch storage event so other tabs pick it up
  window.dispatchEvent(new Event("storage"));
}

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
}

function PortfolioEntrySheet({
  open,
  onClose,
  editEntry,
  currentCount,
}: {
  open: boolean;
  onClose: () => void;
  editEntry: PortfolioEntry | null;
  currentCount: number;
}) {
  const { uploadBlob, uploading, progress } = useBlobStorage();
  const { mutateAsync: createEntry, isPending: isCreating } =
    useCreatePortfolioEntry();
  const { mutateAsync: updateEntry, isPending: isUpdating } =
    useUpdatePortfolioEntry();

  const thumbnailRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PortfolioFormState>({
    title: "",
    description: "",
    embedUrl: "",
    isPublished: true,
  });
  const [thumbnailId, setThumbnailId] = useState<string | undefined>(undefined);
  const [videoBlobId, setVideoBlobId] = useState<string | undefined>(undefined);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Reset form when sheet opens/closes or editEntry changes
  useEffect(() => {
    if (editEntry) {
      setForm({
        title: editEntry.title,
        description: editEntry.description,
        embedUrl: editEntry.embedUrl ?? "",
        isPublished: editEntry.isPublished,
      });
      setThumbnailId(editEntry.thumbnailBlobId);
      setVideoBlobId(editEntry.videoBlobId);
    } else {
      setForm({
        title: "",
        description: "",
        embedUrl: "",
        isPublished: true,
      });
      setThumbnailId(undefined);
      setVideoBlobId(undefined);
    }
    setUploadingVideo(false);
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !file.type.includes("mp4") &&
      !file.name.toLowerCase().endsWith(".mp4")
    ) {
      toast.error("Only MP4 files are supported");
      return;
    }
    setUploadingVideo(true);
    try {
      // Use uploadBlob — progress tracked via shared uploading/progress state
      const hash = await uploadBlob(file);
      if (hash) {
        setVideoBlobId(hash);
        toast.success("Video uploaded!");
      } else {
        toast.error("Video upload failed");
      }
    } finally {
      setUploadingVideo(false);
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
      // Auto-assign sortOrder: keep existing or set as next in list
      sortOrder: editEntry ? editEntry.sortOrder : BigInt(currentCount + 1),
      thumbnailBlobId: thumbnailId,
      videoBlobId: videoBlobId,
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
  const isUploading = uploading || uploadingVideo;

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

            {/* Video Section: MP4 Upload OR Embed URL */}
            <div className="space-y-3 border border-border/60 rounded-xl p-4 bg-muted/10">
              <p className="text-sm font-semibold text-foreground">
                Video Source{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (choose one)
                </span>
              </p>

              {/* Direct MP4 Upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-gold" />
                  Direct MP4 Upload
                </Label>
                <button
                  type="button"
                  className="w-full border border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-gold/40 transition-colors"
                  onClick={() => videoRef.current?.click()}
                  data-ocid="admin.video_dropzone"
                >
                  {videoBlobId ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        MP4 video uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="w-7 h-7 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Click to upload MP4 video</p>
                      <p className="text-xs mt-1 text-muted-foreground/60">
                        Renders as native HTML5 player on the gallery
                      </p>
                    </div>
                  )}
                  {uploadingVideo && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all animate-pulse"
                          style={{ width: "60%" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploading video...
                      </p>
                    </div>
                  )}
                </button>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/mp4,.mp4"
                  className="hidden"
                  data-ocid="admin.video_upload_button"
                  onChange={handleVideoUpload}
                />
                {videoBlobId && (
                  <button
                    type="button"
                    onClick={() => setVideoBlobId(undefined)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove video
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Embed URL */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-gold" />
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
                  disabled={!!videoBlobId}
                />
                <p className="text-xs text-muted-foreground">
                  {videoBlobId
                    ? "Remove the uploaded MP4 to use an embed link instead."
                    : "Use the embed URL (not share URL) for YouTube/Instagram."}
                </p>
              </div>
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
                      {videoBlobId && (
                        <span className="text-xs text-green-300/70 ml-1">
                          (used as video poster)
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Click to upload thumbnail</p>
                    <p className="text-xs mt-1">PNG, JPG, WebP</p>
                    {videoBlobId && (
                      <p className="text-xs mt-1 text-gold/60">
                        Recommended: used as poster for the video player
                      </p>
                    )}
                  </div>
                )}
                {uploading && !uploadingVideo && (
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
            disabled={isSaving || isUploading}
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

// ─── Package Form ─────────────────────────────────────────────────────────────

interface PackageFormState {
  name: string;
  tagline: string;
  videoOnlyPrice: string;
  voiceAddonPrice: string;
  durationDescription: string;
  memberDetails: string;
  isBestSeller: boolean;
  isHidden: boolean;
}

function PackageSheet({
  open,
  onClose,
  editPackage,
  currentCount,
}: {
  open: boolean;
  onClose: () => void;
  editPackage: PackageType | null;
  currentCount: number;
}) {
  const { uploadBlob, uploading, progress } = useBlobStorage();
  const { mutateAsync: createPkg, isPending: isCreating } = useCreatePackage();
  const { mutateAsync: updatePkg, isPending: isUpdating } = useUpdatePackage();

  const thumbnailRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PackageFormState>({
    name: "",
    tagline: "",
    videoOnlyPrice: "",
    voiceAddonPrice: "",
    durationDescription: "",
    memberDetails: "",
    isBestSeller: false,
    isHidden: false,
  });
  const [thumbnailId, setThumbnailId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (editPackage) {
      setForm({
        name: editPackage.name,
        tagline: editPackage.tagline ?? "",
        videoOnlyPrice: Number(editPackage.videoOnlyPrice).toString(),
        voiceAddonPrice: Number(editPackage.voiceAddonPrice).toString(),
        durationDescription: editPackage.durationDescription,
        memberDetails: editPackage.memberDetails,
        isBestSeller: editPackage.isBestSeller,
        isHidden: editPackage.isHidden,
      });
      setThumbnailId(editPackage.thumbnailBlobId);
    } else {
      setForm({
        name: "",
        tagline: "",
        videoOnlyPrice: "",
        voiceAddonPrice: "",
        durationDescription: "",
        memberDetails: "",
        isBestSeller: false,
        isHidden: false,
      });
      setThumbnailId(undefined);
    }
  }, [editPackage]);

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
    if (!form.name.trim()) {
      toast.error("Package name is required");
      return;
    }
    const videoPrice = Number(form.videoOnlyPrice);
    const voicePrice = Number(form.voiceAddonPrice);
    if (!form.videoOnlyPrice || Number.isNaN(videoPrice) || videoPrice < 0) {
      toast.error("Valid Video Only price is required");
      return;
    }
    if (!form.voiceAddonPrice || Number.isNaN(voicePrice) || voicePrice < 0) {
      toast.error("Valid Voice Addon price is required");
      return;
    }

    const input: PackageInput = {
      name: form.name.trim(),
      tagline: form.tagline.trim() || undefined,
      videoOnlyPrice: BigInt(videoPrice),
      voiceAddonPrice: BigInt(voicePrice),
      durationDescription: form.durationDescription.trim(),
      memberDetails: form.memberDetails.trim(),
      isBestSeller: form.isBestSeller,
      isHidden: form.isHidden,
      thumbnailBlobId: thumbnailId,
      sortOrder: editPackage ? editPackage.sortOrder : BigInt(currentCount + 1),
    };

    try {
      if (editPackage) {
        await updatePkg({ id: editPackage.id, input });
        toast.success("Package updated!");
      } else {
        await createPkg(input);
        toast.success("Package created!");
      }
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save package",
      );
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
            {editPackage ? "Edit Package" : "Add Package"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-160px)] pr-1">
          <div className="space-y-5 pb-6">
            {/* Package Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Package Name <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="admin.package_name_input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Basic Tribute Package"
                className="bg-input border-border focus:border-gold"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Tagline{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                data-ocid="admin.package_tagline_input"
                value={form.tagline}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tagline: e.target.value }))
                }
                placeholder="e.g. Perfect for small families"
                className="bg-input border-border focus:border-gold"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Video Only Price ₹ <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="admin.package_video_price_input"
                  type="number"
                  min="0"
                  value={form.videoOnlyPrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, videoOnlyPrice: e.target.value }))
                  }
                  placeholder="1000"
                  className="bg-input border-border focus:border-gold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Voice Addon Price ₹{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="admin.package_voice_price_input"
                  type="number"
                  min="0"
                  value={form.voiceAddonPrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, voiceAddonPrice: e.target.value }))
                  }
                  placeholder="1500"
                  className="bg-input border-border focus:border-gold"
                />
              </div>
            </div>

            {/* Duration Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Duration Description
              </Label>
              <Input
                data-ocid="admin.package_duration_input"
                value={form.durationDescription}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    durationDescription: e.target.value,
                  }))
                }
                placeholder="e.g. 1 Minute video"
                className="bg-input border-border focus:border-gold"
              />
            </div>

            {/* Member Details */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Member Details
              </Label>
              <Textarea
                data-ocid="admin.package_member_details_textarea"
                value={form.memberDetails}
                onChange={(e) =>
                  setForm((p) => ({ ...p, memberDetails: e.target.value }))
                }
                placeholder="e.g. Late person + 1-2 family members"
                className="min-h-[80px] bg-input border-border focus:border-gold resize-none"
              />
            </div>

            {/* Thumbnail Image */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Thumbnail Image
              </Label>
              <button
                type="button"
                className="w-full border border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-gold/40 transition-colors"
                onClick={() => thumbnailRef.current?.click()}
                data-ocid="admin.package_dropzone"
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
                data-ocid="admin.package_upload_button"
                onChange={handleThumbnailUpload}
              />
              {thumbnailId && (
                <button
                  type="button"
                  onClick={() => setThumbnailId(undefined)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove thumbnail
                </button>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border border-border rounded-xl px-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Best Seller
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Show "Best Seller" badge on this package
                  </p>
                </div>
                <Switch
                  data-ocid="admin.package_bestseller_switch"
                  checked={form.isBestSeller}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isBestSeller: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between py-3 border border-border rounded-xl px-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Hide Package
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hidden packages won't show on the pricing page
                  </p>
                </div>
                <Switch
                  data-ocid="admin.package_hidden_switch"
                  checked={form.isHidden}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isHidden: v }))
                  }
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground"
            data-ocid="admin.package_cancel_button"
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.package_save_button"
            onClick={handleSave}
            disabled={isSaving || uploading}
            className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : editPackage ? (
              "Save Changes"
            ) : (
              "Create Package"
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

  // Internet Identity — needed to authorize backend admin calls via _initializeAccessControlWithSecret
  const {
    identity,
    login: iiLogin,
    isInitializing: iiInitializing,
    isLoggingIn,
    loginStatus,
    loginError,
  } = useInternetIdentity();

  // "User is already authenticated" means AuthClient already has a valid identity —
  // treat it as non-blocking (identity loads naturally from AuthClient on init).
  const isAlreadyAuthError =
    loginStatus === "loginError" &&
    loginError?.message === "User is already authenticated";

  const { data: packages } = useGetPackages();

  const [activeTab, setActiveTab] = useState("orders");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [portfolioSheetOpen, setPortfolioSheetOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PortfolioEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Pricing state
  const [packageSheetOpen, setPackageSheetOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<PackageType | null>(null);
  const [deletePackageConfirm, setDeletePackageConfirm] =
    useState<PackageId | null>(null);

  // Reviews CMS state
  const [approvedReviewIds, setApprovedReviewIds] = useState<number[]>(() =>
    getApprovedIds(),
  );

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
  const { data: allPackages, isLoading: packagesLoading } = useGetAllPackages();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateBookingStatus();
  const { mutateAsync: deleteEntry } = useDeletePortfolioEntry();
  const { mutateAsync: seedEntries, isPending: isSeeding } =
    useSeedPortfolioEntries();
  const { mutateAsync: reorderEntry, isPending: isReordering } =
    useReorderPortfolioEntry();
  const { mutateAsync: deletePkg } = useDeletePackage();

  // Redirect if not authenticated via local session
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
    }
  }, [isAuthenticated, navigate]);

  // When admin is authenticated via localStorage but II identity is not yet present,
  // automatically trigger II login so useActor can call _initializeAccessControlWithSecret.
  // Fire as soon as AuthClient finishes initializing and no identity is loaded.
  useEffect(() => {
    if (!isAuthenticated || iiInitializing || identity || isLoggingIn) return;
    // Only trigger once when idle (not in an error state from a previous attempt)
    if (loginStatus !== "idle") return;

    iiLogin();
  }, [
    isAuthenticated,
    iiInitializing,
    identity,
    isLoggingIn,
    loginStatus,
    iiLogin,
  ]);

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

  const handleDeletePackage = async (id: PackageId) => {
    try {
      await deletePkg(id);
      toast.success("Package deleted");
      setDeletePackageConfirm(null);
    } catch {
      toast.error("Failed to delete package");
    }
  };

  const handleReorder = async (id: bigint, direction: ReorderDirection) => {
    try {
      await reorderEntry({ id, direction });
    } catch {
      toast.error("Failed to reorder entry");
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

  // Sort portfolio by sortOrder
  const sortedPortfolio = portfolio
    ? [...portfolio].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
    : [];

  // Sort packages by sortOrder
  const sortedPackages = allPackages
    ? [...allPackages].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
    : [];

  // Show a connecting screen only while II is actively initializing or the popup is open.
  // Once initialization settles (idle/error/success), render the dashboard.
  // If the actor is anonymous (no identity), admin writes will fail with toast errors
  // and the user can retry — but don't block the entire dashboard.
  if (isAuthenticated && (iiInitializing || isLoggingIn)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground text-lg">
              {isLoggingIn
                ? "Complete Authorization"
                : "Connecting to Dashboard"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoggingIn
                ? "A browser popup has opened — please complete the step to authorize admin access."
                : "Loading your secure admin session…"}
            </p>
          </div>
          {isLoggingIn && (
            <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
              This one-time step links your browser to the admin account. You
              won't need to repeat it until your session expires.
            </p>
          )}
        </div>
      </div>
    );
  }

  // If II login errored (popup dismissed) and we have no identity, show retry.
  // The dashboard is still accessible but admin writes will fail without identity.
  if (
    isAuthenticated &&
    loginStatus === "loginError" &&
    !identity &&
    !isAlreadyAuthError
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground text-lg">
              Authorization Required
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              The secure authorization step is needed to perform admin
              operations like managing portfolio entries and bookings.
            </p>
          </div>
          <Button
            onClick={iiLogin}
            className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
          >
            Retry Authorization
          </Button>
        </div>
      </div>
    );
  }

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
                data-ocid="admin.pricing_tab"
                value="pricing"
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Pricing
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
              <TabsTrigger
                data-ocid="admin.reviews_tab"
                value="reviews"
                className="flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Reviews
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
              ) : !sortedPortfolio || sortedPortfolio.length === 0 ? (
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
                  {sortedPortfolio.map((entry, i) => (
                    <div
                      key={entry.id.toString()}
                      data-ocid={`admin.portfolio_item.${i + 1}`}
                      className="bg-card rounded-xl border border-border overflow-hidden card-glow relative"
                    >
                      {/* Up/Down Reorder Buttons */}
                      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                        <Button
                          data-ocid={`admin.portfolio_up_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          disabled={i === 0 || isReordering}
                          onClick={() =>
                            handleReorder(entry.id, ReorderDirection.up)
                          }
                          className="h-7 w-7 p-0 bg-black/40 hover:bg-black/60 text-white/70 hover:text-white disabled:opacity-30 rounded"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          data-ocid={`admin.portfolio_down_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          disabled={
                            i === sortedPortfolio.length - 1 || isReordering
                          }
                          onClick={() =>
                            handleReorder(entry.id, ReorderDirection.down)
                          }
                          className="h-7 w-7 p-0 bg-black/40 hover:bg-black/60 text-white/70 hover:text-white disabled:opacity-30 rounded"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Thumbnail */}
                      <div className="aspect-video bg-muted relative">
                        {entry.thumbnailBlobId ? (
                          <AdminBlobImage
                            blobId={entry.thumbnailBlobId}
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
                        {entry.videoBlobId && (
                          <p className="text-xs text-blue-400/70 mt-1 flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            Direct MP4 uploaded
                          </p>
                        )}
                        {!entry.videoBlobId && entry.embedUrl && (
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

            {/* ─── Pricing Tab ─────────────────────────────── */}
            <TabsContent value="pricing" className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Packages
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage your service packages. Changes reflect immediately on
                    the pricing page.
                  </p>
                </div>
                <Button
                  data-ocid="admin.package_add_button"
                  onClick={() => {
                    setEditPackage(null);
                    setPackageSheetOpen(true);
                  }}
                  className="bg-gold text-primary-foreground hover:bg-gold-light font-semibold"
                  size="sm"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add Package
                </Button>
              </div>

              {packagesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["pkg-sk-1", "pkg-sk-2", "pkg-sk-3"].map((id) => (
                    <Skeleton key={id} className="h-56 w-full rounded-xl" />
                  ))}
                </div>
              ) : !sortedPackages || sortedPackages.length === 0 ? (
                <div
                  data-ocid="admin.pricing_empty_state"
                  className="text-center py-16 rounded-xl border border-dashed border-border"
                >
                  <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No packages yet</p>
                  <Button
                    className="mt-4 bg-gold text-primary-foreground hover:bg-gold-light"
                    size="sm"
                    onClick={() => {
                      setEditPackage(null);
                      setPackageSheetOpen(true);
                    }}
                  >
                    Add First Package
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedPackages.map((pkg, i) => (
                    <div
                      key={pkg.id.toString()}
                      data-ocid={`admin.pricing_item.${i + 1}`}
                      className="bg-card rounded-xl border border-border overflow-hidden card-glow"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full h-36 bg-gradient-to-br from-[oklch(0.18_0.03_60)] via-[oklch(0.22_0.06_70)] to-[oklch(0.16_0.02_50)] overflow-hidden">
                        {pkg.thumbnailBlobId ? (
                          <AdminBlobImage
                            blobId={pkg.thumbnailBlobId}
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <Package className="w-8 h-8 text-gold/30" />
                            <span className="text-xs text-gold/40 font-semibold uppercase tracking-widest">
                              {pkg.name.split(" ").slice(0, 2).join(" ")}
                            </span>
                          </div>
                        )}
                        {/* Badges overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          {pkg.isBestSeller && (
                            <span className="bg-gold text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                              ✦ Best Seller
                            </span>
                          )}
                          {pkg.isHidden && (
                            <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full border border-border">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-display font-semibold text-foreground text-sm line-clamp-1">
                          {pkg.name}
                        </h3>
                        {pkg.tagline && (
                          <p className="text-xs text-muted-foreground/70 italic line-clamp-1">
                            {pkg.tagline}
                          </p>
                        )}
                        {/* Prices */}
                        <div className="flex items-center gap-3">
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              Video:{" "}
                            </span>
                            <span className="text-gold font-semibold">
                              ₹{formatPrice(pkg.videoOnlyPrice)}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              +Voice:{" "}
                            </span>
                            <span className="text-gold font-semibold">
                              ₹{formatPrice(pkg.voiceAddonPrice)}
                            </span>
                          </div>
                        </div>
                        {pkg.durationDescription && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {pkg.durationDescription}
                          </p>
                        )}
                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            data-ocid={`admin.pricing_edit_button.${i + 1}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditPackage(pkg);
                              setPackageSheetOpen(true);
                            }}
                            className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            data-ocid={`admin.pricing_delete_button.${i + 1}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletePackageConfirm(pkg.id)}
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

            {/* ─── Reviews Tab ──────────────────────────────── */}
            <TabsContent value="reviews" className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Reviews & Testimonials
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Toggle which reviews appear on the public homepage.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {STATIC_REVIEWS.map((review, i) => {
                  const isApproved = approvedReviewIds.includes(review.id);
                  return (
                    <div
                      key={review.id}
                      data-ocid={`admin.review_item.${i + 1}`}
                      className={`bg-card rounded-xl border p-5 transition-all ${
                        isApproved
                          ? "border-gold/20"
                          : "border-border opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="font-semibold text-foreground text-sm">
                              {review.name}
                            </p>
                            <span className="text-xs text-muted-foreground/60">
                              {review.location} · {review.event}
                            </span>
                            <div className="flex items-center gap-0.5 ml-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className="w-3 h-3 text-gold fill-current"
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic">
                            "{review.text}"
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <Switch
                            data-ocid={`admin.review_switch.${i + 1}`}
                            checked={isApproved}
                            onCheckedChange={(checked) => {
                              const newIds = checked
                                ? [...approvedReviewIds, review.id]
                                : approvedReviewIds.filter(
                                    (id) => id !== review.id,
                                  );
                              setApprovedReviewIds(newIds);
                              saveApprovedIds(newIds);
                            }}
                          />
                          <span
                            className={`text-xs font-medium ${isApproved ? "text-green-400" : "text-muted-foreground"}`}
                          >
                            {isApproved ? "Visible" : "Hidden"}
                          </span>
                        </div>
                      </div>
                      {/* Quick action buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                        <Button
                          data-ocid={`admin.review_approve_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          disabled={isApproved}
                          onClick={() => {
                            const newIds = [...approvedReviewIds, review.id];
                            setApprovedReviewIds(newIds);
                            saveApprovedIds(newIds);
                          }}
                          className="h-7 px-3 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20 disabled:opacity-30"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          data-ocid={`admin.review_reject_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          disabled={!isApproved}
                          onClick={() => {
                            const newIds = approvedReviewIds.filter(
                              (id) => id !== review.id,
                            );
                            setApprovedReviewIds(newIds);
                            saveApprovedIds(newIds);
                          }}
                          className="h-7 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 disabled:opacity-30"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Hide
                        </Button>
                        <span className="ml-auto text-xs text-muted-foreground/40">
                          Review #{review.id + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-muted/20 rounded-xl border border-border text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  How this works
                </p>
                <p>
                  Approved reviews are shown on the public homepage. Toggle the
                  switch to show or hide each review instantly — no page reload
                  needed.
                </p>
              </div>
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
        currentCount={sortedPortfolio.length}
      />

      {/* Package Sheet */}
      <PackageSheet
        open={packageSheetOpen}
        onClose={() => {
          setPackageSheetOpen(false);
          setEditPackage(null);
        }}
        editPackage={editPackage}
        currentCount={sortedPackages.length}
      />

      {/* Order Details Sheet */}
      <OrderDetailsSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />

      {/* Delete Portfolio Confirm Dialog */}
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

      {/* Delete Package Confirm Dialog */}
      <AlertDialog
        open={deletePackageConfirm !== null}
        onOpenChange={() => setDeletePackageConfirm(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Delete Package
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this package? This will remove it
              from the pricing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.pricing_delete_cancel_button"
              className="border-border text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.pricing_delete_confirm_button"
              onClick={() =>
                deletePackageConfirm !== null &&
                handleDeletePackage(deletePackageConfirm)
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
