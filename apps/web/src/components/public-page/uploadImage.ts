import { generatePreSignUrl } from '@shared-core/fetchApi/api.fetch'
import { isPublicPageImage } from './types'

/** What the file picker offers. HEIC is left out: browsers cannot show it. */
export const PUBLIC_PAGE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 10 * 1024 * 1024

/**
 * Uploads an image for the public page and returns the stored filename.
 *
 * Same path as the settings gallery: a presigned URL for the `project` folder,
 * then the PUT through the `/api/upload-image` proxy. Nothing is saved to the
 * page here. The caller decides where the filename goes, and only a layout or
 * settings save publishes it, so an upload that is abandoned never appears on
 * the page.
 *
 * Throws an Error with a message fit to show the user.
 */
export async function uploadPublicPageImage(accessToken: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Use a JPG, PNG, WebP or GIF image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('The image must be smaller than 10 MB.')
  }

  const presign = await generatePreSignUrl(accessToken, {
    fileName: file.name,
    fileType: file.type,
    folder: 'project',
  })
  const data = presign?.data?.data || presign?.data
  if (!data?.uploadUrl || !data?.fileName) {
    throw new Error('Could not start the upload. Try again.')
  }

  const body = new FormData()
  body.append('file', file)
  const put = await fetch(`/api/upload-image?uploadUrl=${encodeURIComponent(data.uploadUrl)}`, {
    method: 'PUT',
    body,
  })
  if (!put.ok) throw new Error('The upload failed. Try again.')

  // The server would refuse this value on save anyway. Failing here says why
  // at the moment of the upload instead of at the save.
  if (!isPublicPageImage(data.fileName)) {
    throw new Error('The upload returned a name this page cannot use.')
  }
  return data.fileName
}
