// Utility to convert Supabase audio URLs to local URLs for development
import { SUPABASE_PUBLIC_URL_DOMAIN } from './supabase-config'
import { isLocalDev } from './local-dev-utils'

export const convertToLocalAudioUrl = (supabaseUrl) => {
  if (!isLocalDev || !supabaseUrl) {
    return supabaseUrl
  }

  try {
    // Extract filename from Supabase URL
    const url = new URL(supabaseUrl)
    const pathParts = url.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]

    // Remove query parameters (like ?v=timestamp)
    const cleanFilename = filename.split('?')[0]

    // Convert to local URL (without static prefix since files are copied to public/)
    return `/local-audio/${cleanFilename}`
  } catch (error) {
    console.warn('Failed to convert audio URL to local:', error)
    return supabaseUrl
  }
}

export const convertAudioUrlsToLocal = (audioUrls) => {
  if (!isLocalDev || !audioUrls) {
    return audioUrls
  }

  if (Array.isArray(audioUrls)) {
    return audioUrls.map((url) => convertToLocalAudioUrl(url))
  }

  if (typeof audioUrls === 'string') {
    return convertToLocalAudioUrl(audioUrls)
  }

  return audioUrls
}

export const convertCoverArtUrlToLocal = (supabaseUrl, postName) => {
  if (!isLocalDev || !supabaseUrl) {
    return supabaseUrl
  }

  try {
    // Extract post name from URL or use provided postName
    let postNameFromUrl = postName
    if (!postNameFromUrl) {
      // Handle both full URLs and storage paths
      if (supabaseUrl.startsWith('http')) {
        const url = new URL(supabaseUrl)
        const pathParts = url.pathname.split('/')
        const filename = pathParts[pathParts.length - 1]
        postNameFromUrl = filename.replace('.png', '').split('?')[0]
      } else if (supabaseUrl.includes('/')) {
        // Handle storage path like "cover-art/25jul16.png"
        const filename = supabaseUrl.split('/').pop()
        postNameFromUrl = filename.replace('.png', '')
      }
    }

    return `/local-cover-art/${postNameFromUrl}.png`
  } catch (error) {
    console.warn('Failed to convert cover art URL to local:', error)
    return supabaseUrl
  }
}

export const getCoverArtUrl = (storagePath) => {
  if (!storagePath) {
    return null
  }

  // If it's already a full URL, return as is
  if (storagePath.startsWith('http')) {
    return storagePath
  }

  // Convert storage path to full URL
  return `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${storagePath}`
}

const localAudioUrls = {
  convertToLocalAudioUrl,
  convertAudioUrlsToLocal,
  convertCoverArtUrlToLocal,
  isLocalDev,
}

export default localAudioUrls
