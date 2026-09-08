'use client'

import { create } from 'zustand'

export const useActionStore = create((set) => ({
  actions: [],
  viewMode: 'kanban',

  setActions: (actions) => set({ actions }),

  addAction: (action) =>
    set((state) => ({
      actions: [action, ...state.actions],
    })),

  updateAction: (id, updates) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  removeAction: (id) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id),
    })),

  moveAction: (id, status, position) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, status, position } : a
      ),
    })),

  reorderActions: (updates) =>
    set((state) => {
      const updateMap = new Map(updates.map((u) => [u.id, u]))
      return {
        actions: state.actions.map((a) => {
          const update = updateMap.get(a.id)
          return update ? { ...a, ...update } : a
        }),
      }
    }),

  rollbackActions: (snapshot) => set({ actions: snapshot }),

  setViewMode: (mode) => set({ viewMode: mode }),
}))
