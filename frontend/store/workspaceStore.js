'use client'

import { create } from 'zustand'

export const useWorkspaceStore = create((set) => ({
  workspaces: [],
  activeWorkspace: null,
  members: [],
  onlineUserIds: [],

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),

  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
      activeWorkspace:
        state.activeWorkspace?.id === id
          ? { ...state.activeWorkspace, ...updates }
          : state.activeWorkspace,
    })),

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      activeWorkspace:
        state.activeWorkspace?.id === id ? null : state.activeWorkspace,
    })),

  setMembers: (members) => set({ members }),

  setOnline: (userIds) => set({ onlineUserIds: userIds }),

  addMember: (member) =>
    set((state) => ({
      members: [...state.members, member],
    })),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  updateMemberRole: (userId, role) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, role } : m
      ),
    })),

  updateMemberStatus: (userId, isActive) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, isActive } : m
      ),
    })),

  updateMember: (userId, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, ...updates } : m
      ),
    })),
}))
