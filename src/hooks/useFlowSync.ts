// src/hooks/useFlowSync.ts
// Real-time Socket.IO sync for React Flow nodes & edges
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useFlowStore } from "../store/useFlowStore";

let socket: Socket | null = null;

export function useFlowSync(boardId: string, userName: string, enabled: boolean) {
  const { setNodes, setEdges } = useFlowStore();
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdate = useRef(false);
  // Don't emit until we've confirmed our local store has real content
  // (avoids overwriting the server cache with the initial empty state)
  const hasReceivedState = useRef(false);

  useEffect(() => {
    if (!enabled || !boardId) return;

    socket = io(`${process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"}", { transports: ["websocket"] });

    socket.on("connect", () => {
      // Joining the board room registers this user in the collaborators list
      socket?.emit("join_board", { boardId, name: userName || "Anonymous" });
    });

    // room_state is sent back after join_board succeeds
    socket.on("room_state", () => {
      // Ask server for the latest cached flowchart state
      socket?.emit("request_flow_state", { boardId });
    });

    // Receive full state when joining a board that already has content
    socket.on("flow_state", ({ nodes: remoteNodes, edges: remoteEdges }) => {
      if (remoteNodes?.length || remoteEdges?.length) {
        isRemoteUpdate.current = true;
        setNodes(remoteNodes);
        setEdges(remoteEdges);
        setTimeout(() => { isRemoteUpdate.current = false; }, 200);
      }
      // Either way, we're now allowed to emit our own updates
      hasReceivedState.current = true;
    });

    // Live updates pushed from other collaborators
    socket.on("flow_update", ({ nodes: remoteNodes, edges: remoteEdges }) => {
      isRemoteUpdate.current = true;
      setNodes(remoteNodes);
      setEdges(remoteEdges);
      setTimeout(() => { isRemoteUpdate.current = false; }, 200);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      hasReceivedState.current = false;
    };
  }, [boardId, userName, enabled]);

  const emitUpdate = useCallback(
    (nodes: any[], edges: any[]) => {
      // Don't emit: if the update came from a remote user, or if we haven't
      // yet received the server state (avoids overwriting cache with empty [])
      if (isRemoteUpdate.current) return;
      if (!hasReceivedState.current && nodes.length === 0 && edges.length === 0) return;

      if (throttleRef.current) clearTimeout(throttleRef.current);
      throttleRef.current = setTimeout(() => {
        socket?.emit("flow_update", { boardId, nodes, edges });
        throttleRef.current = null;
      }, 100);
    },
    [boardId]
  );

  return { emitUpdate };
}
