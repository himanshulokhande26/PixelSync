// src/hooks/useSocket.ts
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useBoardStore } from "../store/useBoardStore";
import { useCollabStore } from "../store/useCollabStore";
import { useFlowStore } from "../store/useFlowStore";

// ONE shared socket across the whole app.
let socket: Socket | null = null;

export function useSocket(boardId: string, userName: string) {
  const { addElement, updateElement, deleteElements }   = useBoardStore.getState();
  const { addCollaborator, removeCollaborator, updateCursor, setCollaborators } = useCollabStore.getState();
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowThrottleRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingRemote  = useRef(false);

  useEffect(() => {
    if (!userName || !boardId) return;

    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", { transports: ["websocket"] });

    // ── Join ────────────────────────────────────────────────────────
    socket.on("connect", () => {
      console.log("[Socket] connected:", socket?.id);
      socket?.emit("join_board", { boardId, name: userName });
    });

    socket.on("room_state", ({ collaborators }) => {
      setCollaborators(collaborators);
      // Once in the room, request the latest flowchart snapshot (if any)
      socket?.emit("request_flow_state", { boardId });
    });

    socket.on("user_joined", (user) => addCollaborator(user));
    socket.on("user_left",   ({ userId }) => removeCollaborator(userId));

    // ── Canvas events ───────────────────────────────────────────────
    socket.on("draw_element", (element) => {
      const exists = useBoardStore.getState().elements.some(e => e.id === element.id);
      if (!exists) addElement(element);
    });

    socket.on("update_element", ({ id, elementData }) => updateElement(id, elementData));
    socket.on("delete_elements", (ids: string[]) => deleteElements(ids));

    socket.on("cursor_move", ({ userId, name, color, x, y }) => {
      updateCursor(userId, x, y);
      addCollaborator({ userId, name, color, cursorX: x, cursorY: y });
    });

    // ── Flowchart events ────────────────────────────────────────────
    // Server sends the cached full state when we ask (on room_state)
    socket.on("flow_state", ({ nodes, edges }) => {
      console.log("[Socket] flow_state received — nodes:", nodes?.length, "edges:", edges?.length);
      if (nodes?.length || edges?.length) {
        isApplyingRemote.current = true;
        useFlowStore.getState().setNodes(nodes ?? []);
        useFlowStore.getState().setEdges(edges ?? []);
        // Long enough to cover any pending DB fetch that might arrive after
        setTimeout(() => { isApplyingRemote.current = false; }, 500);
      }
    });

    // Another user pushed an update
    socket.on("flow_update", ({ nodes, edges }) => {
      console.log("[Socket] flow_update received — nodes:", nodes?.length);
      isApplyingRemote.current = true;
      useFlowStore.getState().setNodes(nodes ?? []);
      useFlowStore.getState().setEdges(edges ?? []);
      setTimeout(() => { isApplyingRemote.current = false; }, 300);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [boardId, userName]);

  // ── Canvas emitters ─────────────────────────────────────────────
  const emitDrawElement    = (element: any)              => socket?.emit("draw_element",    { boardId, element });
  const emitUpdateElement  = (id: string, data: any)     => socket?.emit("update_element",  { boardId, id, elementData: data });
  const emitDeleteElements = (ids: string[])             => socket?.emit("delete_elements", { boardId, ids });

  const emitCursorMove = (x: number, y: number) => {
    if (cursorThrottleRef.current) return;
    cursorThrottleRef.current = setTimeout(() => {
      socket?.emit("cursor_move", { boardId, x, y });
      cursorThrottleRef.current = null;
    }, 30);
  };

  // ── Flowchart emitter (throttled 120ms, skips remote-applied changes) ─
  const emitFlowUpdate = useCallback((nodes: any[], edges: any[]) => {
    if (isApplyingRemote.current) return;
    if (flowThrottleRef.current) clearTimeout(flowThrottleRef.current);
    flowThrottleRef.current = setTimeout(() => {
      console.log("[Socket] emitting flow_update — nodes:", nodes.length);
      socket?.emit("flow_update", { boardId, nodes, edges });
      flowThrottleRef.current = null;
    }, 120);
  }, []);

  return { emitDrawElement, emitUpdateElement, emitDeleteElements, emitCursorMove, emitFlowUpdate };
}
