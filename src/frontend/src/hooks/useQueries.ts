import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Booking,
  BookingId,
  BookingInput,
  BookingStatus,
  ClientMessage,
  ClientMessageId,
  Package,
  PortfolioEntry,
  PortfolioEntryId,
  PortfolioEntryInput,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Packages ────────────────────────────────────────────────────────────────

export function useGetPackages() {
  const { actor, isFetching } = useActor();
  return useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPackages();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export function useGetPublishedPortfolioEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioEntry[]>({
    queryKey: ["portfolio", "published"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublishedPortfolioEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPortfolioEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioEntry[]>({
    queryKey: ["portfolio", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPortfolioEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePortfolioEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<PortfolioEntryId, Error, PortfolioEntryInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPortfolioEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useUpdatePortfolioEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: PortfolioEntryId; input: PortfolioEntryInput }
  >({
    mutationFn: async ({ id, input }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePortfolioEntry(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useDeletePortfolioEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, PortfolioEntryId>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePortfolioEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useSeedPortfolioEntries() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.seedPortfolioEntries();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export function useCreateBooking() {
  const { actor } = useActor();
  return useMutation<BookingId, Error, BookingInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createBooking(input);
    },
  });
}

export function useGetBookings(statusFilter: BookingStatus | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["bookings", statusFilter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBookings(statusFilter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: BookingId; status: BookingStatus; adminNotes: string | null }
  >({
    mutationFn: async ({ id, status, adminNotes }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBookingStatus(id, status, adminNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
  return {
    ...query,
    isLoading: query.isLoading || actorFetching,
  };
}

export function useGetBookingById(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking | null>({
    queryKey: ["booking", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getBookingById(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

// ─── Client Messages ──────────────────────────────────────────────────────────

export function useGetAllClientMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ClientMessage[]>({
    queryKey: ["clientMessages", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllClientMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClientMessages(bookingId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ClientMessage[]>({
    queryKey: ["clientMessages", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return [];
      return actor.getClientMessages(bookingId);
    },
    enabled: !!actor && !isFetching && bookingId !== null,
  });
}

export function useSendClientMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    ClientMessageId,
    Error,
    { bookingId: BookingId; senderName: string; messageText: string }
  >({
    mutationFn: async ({ bookingId, senderName, messageText }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendClientMessage(bookingId, senderName, messageText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientMessages"] });
    },
  });
}
