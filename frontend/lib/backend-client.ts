import { createClient } from '@/lib/backend/client'

/**
 * Backend API client instance configured for server-side use
 * Uses environment variable NEXT_PUBLIC_API_URL or defaults to http://localhost:8080
 */
export const backendClient = createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
})
