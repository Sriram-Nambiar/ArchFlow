// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "./types/canvas";
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      /** Real-time cursor coordinates on the canvas, or null when off-canvas. */
      cursor: { x: number; y: number } | null;
      /** True while this user's AI generation is in-flight. */
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      /** React Flow diagram backed by Liveblocks. Key matches useLiveblocksFlow default. */
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        /** Display name shown in presence UI. */
        name: string;
        /** Avatar URL from Clerk. */
        avatar: string;
        /** Deterministic cursor color derived from user ID. */
        cursorColor: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: Record<string, never>;

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
  }
}

export {};
