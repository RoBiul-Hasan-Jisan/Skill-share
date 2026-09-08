'use client'

import { create } from 'zustand'

export const useGoalStore = create((set) => ({
  goals: [],
  activeGoal: null,

  setGoals: (goals) => set({ goals }),

  addGoal: (goal) =>
    set((state) => ({
      goals: [goal, ...state.goals],
    })),

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
      activeGoal:
        state.activeGoal?.id === id
          ? { ...state.activeGoal, ...updates }
          : state.activeGoal,
    })),

  removeGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
      activeGoal:
        state.activeGoal?.id === id ? null : state.activeGoal,
    })),

  setActiveGoal: (goal) => set({ activeGoal: goal }),

  rollbackGoals: (snapshot) => set({ goals: snapshot }),
}))
