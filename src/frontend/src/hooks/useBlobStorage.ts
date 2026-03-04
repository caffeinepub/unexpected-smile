import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { ExternalBlob } from "../backend";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export { ExternalBlob };

interface BlobStorageState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useBlobStorage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [state, setState] = useState<BlobStorageState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const uploadBlob = useCallback(
    async (file: File): Promise<string | null> => {
      if (!actor) {
        setState((prev) => ({ ...prev, error: "Actor not available" }));
        return null;
      }

      setState({ uploading: true, progress: 0, error: null });

      try {
        const config = await loadConfig();
        const bytes = new Uint8Array(await file.arrayBuffer());

        const agentOptions = identity ? { identity } : {};
        const agent = await HttpAgent.create({
          host: config.backend_host,
          ...agentOptions,
        });

        const storageClient = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );

        const result = await storageClient.putFile(bytes, (pct) => {
          setState((prev) => ({ ...prev, progress: pct }));
        });

        setState({ uploading: false, progress: 100, error: null });
        return result.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ uploading: false, progress: 0, error: message });
        return null;
      }
    },
    [actor, identity],
  );

  const getBlobURL = useCallback(
    async (hash: string): Promise<string | null> => {
      if (!hash) return null;
      try {
        const config = await loadConfig();
        const agentOptions = identity ? { identity } : {};
        const agent = await HttpAgent.create({
          host: config.backend_host,
          ...agentOptions,
        });
        const storageClient = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );
        return await storageClient.getDirectURL(hash);
      } catch {
        return null;
      }
    },
    [identity],
  );

  return {
    uploadBlob,
    getBlobURL,
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,
  };
}
