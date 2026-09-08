import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState()
    const token = state.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      const state = useAuthStore.getState()
      if (!state.user) window.location.href = '/login'
    } else if (status === 403) {
      toast.error("You don't have permission to do that")
    } else if (status >= 500) {
      toast.error('Something went wrong. Please try again.')
    }

    return Promise.reject(error)
  }
)

export default api
