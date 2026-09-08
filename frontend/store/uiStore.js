'use client'

import { create } from 'zustand'

export const useUIStore = create((set) => ({
  theme: 'light',
  sidebarOpen: true,
  commandPaletteOpen: false,
  activeModal: null,
  modalData: null,

  setTheme: (newTheme) =>
    set({
      theme: newTheme,
    }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  openModal: (name, data = null) =>
    set({
      activeModal: name,
      modalData: data,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: null,
    }),

  toggleCommandPalette: () =>
    set((state) => ({
      commandPaletteOpen: !state.commandPaletteOpen,
    })),
}))
