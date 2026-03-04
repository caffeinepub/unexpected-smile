import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type BookingId = bigint;
export interface PortfolioEntryInput {
    title: string;
    videoBlobId?: string;
    isPublished: boolean;
    thumbnailBlobId?: string;
    sortOrder: bigint;
    description: string;
    embedUrl?: string;
}
export interface BookingInput {
    addOn: Variant_videoOnly_videoAndVoice;
    clientName: string;
    customInstructions: string;
    clientEmail: string;
    advanceAmount: bigint;
    clientPhone: string;
    utrNumber: string;
    packageId: PackageId;
}
export interface PackageInput {
    videoOnlyPrice: bigint;
    tagline?: string;
    thumbnailBlobId?: string;
    sortOrder: bigint;
    durationDescription: string;
    name: string;
    memberDetails: string;
    isHidden: boolean;
    isBestSeller: boolean;
    voiceAddonPrice: bigint;
}
export interface ClientMessage {
    id: ClientMessageId;
    bookingId: BookingId;
    createdAt: bigint;
    messageText: string;
    senderName: string;
}
export interface Package {
    id: PackageId;
    videoOnlyPrice: bigint;
    tagline?: string;
    thumbnailBlobId?: string;
    sortOrder: bigint;
    durationDescription: string;
    name: string;
    memberDetails: string;
    isHidden: boolean;
    isBestSeller: boolean;
    voiceAddonPrice: bigint;
}
export type ClientMessageId = bigint;
export type PortfolioEntryId = bigint;
export type PackageId = bigint;
export interface Booking {
    id: BookingId;
    status: BookingStatus;
    addOn: Variant_videoOnly_videoAndVoice;
    clientName: string;
    customInstructions: string;
    createdAt: bigint;
    clientEmail: string;
    advanceAmount: bigint;
    clientPhone: string;
    utrNumber: string;
    adminNotes?: string;
    packageId: PackageId;
}
export interface PortfolioEntry {
    id: PortfolioEntryId;
    title: string;
    videoBlobId?: string;
    isPublished: boolean;
    thumbnailBlobId?: string;
    sortOrder: bigint;
    createdAt: bigint;
    description: string;
    embedUrl?: string;
}
export interface UserProfile {
    name: string;
}
export enum BookingStatus {
    pendingVerification = "pendingVerification",
    completed = "completed",
    approved = "approved",
    rejected = "rejected"
}
export enum ReorderDirection {
    up = "up",
    down = "down"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_videoOnly_videoAndVoice {
    videoOnly = "videoOnly",
    videoAndVoice = "videoAndVoice"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBooking(input: BookingInput): Promise<BookingId>;
    createPackage(input: PackageInput): Promise<PackageId>;
    createPortfolioEntry(input: PortfolioEntryInput): Promise<PortfolioEntryId>;
    deletePackage(id: PackageId): Promise<void>;
    deletePortfolioEntry(id: PortfolioEntryId): Promise<void>;
    getAllClientMessages(): Promise<Array<ClientMessage>>;
    getAllPackages(): Promise<Array<Package>>;
    getAllPortfolioEntries(): Promise<Array<PortfolioEntry>>;
    getBookingById(id: BookingId): Promise<Booking | null>;
    getBookings(statusFilter: BookingStatus | null): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClientMessages(bookingId: BookingId): Promise<Array<ClientMessage>>;
    getPackages(): Promise<Array<Package>>;
    getPublishedPortfolioEntries(): Promise<Array<PortfolioEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    reorderPortfolioEntry(id: PortfolioEntryId, direction: ReorderDirection): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendClientMessage(bookingId: BookingId, senderName: string, messageText: string): Promise<ClientMessageId>;
    updateBookingStatus(id: BookingId, status: BookingStatus, adminNotes: string | null): Promise<void>;
    updatePackage(id: PackageId, input: PackageInput): Promise<void>;
    updatePortfolioEntry(id: PortfolioEntryId, input: PortfolioEntryInput): Promise<void>;
}
