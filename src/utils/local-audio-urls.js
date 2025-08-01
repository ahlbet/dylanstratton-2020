// Utility to convert Supabase audio URLs to local URLs for development

const isLocalDev =
  process.env.NODE_ENV === 'development' &&
  process.env.GATSBY_USE_LOCAL_DATA === 'true'

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
      const url = new URL(supabaseUrl)
      const pathParts = url.pathname.split('/')
      const filename = pathParts[pathParts.length - 1]
      postNameFromUrl = filename.replace('.png', '').split('?')[0]
    }

    return `/local-cover-art/${postNameFromUrl}.png`
  } catch (error) {
    console.warn('Failed to convert cover art URL to local:', error)
    return supabaseUrl
  }
}

const localAudioUrls = {
  convertToLocalAudioUrl,
  convertAudioUrlsToLocal,
  convertCoverArtUrlToLocal,
  isLocalDev,
}

export default localAudioUrls
