import { create } from "zustand";

export interface Collaborator {
  userId: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
}

interface CollabState {
  userName: string;
  setUserName: (name: string) => void;
  collaborators: Record<string, Collaborator>;
  addCollaborator: (user: Collaborator) => void;
  removeCollaborator: (userId: string) => void;
  updateCursor: (userId: string, x: number, y: number) => void;
  setCollaborators: (users: Collaborator[]) => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  userName: "",
  setUserName: (name) => set({ userName: name }),
  collaborators: {},
  setCollaborators: (users) => {
    const map: Record<string, Collaborator> = {};
    users.forEach((u) => (map[u.userId] = u));
    set({ collaborators: map });
  },
  addCollaborator: (user) =>
    set((state) => ({
      collaborators: { ...state.collaborators, [user.userId]: user },
    })),
  removeCollaborator: (userId) =>
    set((state) => {
      const updated = { ...state.collaborators };
      delete updated[userId];
      return { collaborators: updated };
    }),
  updateCursor: (userId, x, y) =>
    set((state) => ({
      collaborators: {
        ...state.collaborators,
        [userId]: { ...state.collaborators[userId], cursorX: x, cursorY: y },
      },
    })),
}));
