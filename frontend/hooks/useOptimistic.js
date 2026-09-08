'use client'

import toast from 'react-hot-toast'

export function useOptimistic() {
  return async function optimisticUpdate(storeUpdateFn, apiFn, rollbackFn) {
    const snapshot = storeUpdateFn()

    try {
      await apiFn()
    } catch (error) {
      rollbackFn(snapshot)
      toast.error('Action failed — changes reverted')
      throw error
    }
  }
}
