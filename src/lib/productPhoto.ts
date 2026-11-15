const MAX_PHOTO_BYTES = 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export class PhotoInputError extends Error {}

export function validatePhoto(photo: Blob): void {
  if (!PHOTO_TYPES.some((type) => type === photo.type) || photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
    throw new PhotoInputError('사진은 JPG·PNG·WebP, 1MB 이하로 선택해 주세요.')
  }
}

export function parsePhotoUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    throw new PhotoInputError('http:// 또는 https://로 시작하는 이미지 주소를 입력해 주세요.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new PhotoInputError('로그인 정보가 없는 http:// 또는 https:// 이미지 주소를 입력해 주세요.')
  }
  return url
}

export async function loadPhotoUrl(value: string): Promise<Blob> {
  const url = parsePhotoUrl(value)
  let response: Response
  try {
    response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    if (!(error instanceof Error)) throw error
    throw new PhotoInputError('사진 주소에 접근할 수 없거나 외부 불러오기가 차단되었습니다(CORS). 사진을 내려받아 파일로 선택해 주세요.')
  }
  if (!response.ok) {
    throw new PhotoInputError(`이미지 주소가 응답하지 않았습니다. (HTTP ${response.status}) 사진을 내려받은 뒤 파일로 선택해 주세요.`)
  }
  if (Number(response.headers.get('content-length')) > MAX_PHOTO_BYTES) {
    throw new PhotoInputError('사진은 1MB 이하로 선택해 주세요.')
  }
  const photo = await response.blob()
  validatePhoto(photo)
  return photo
}

export async function readPhotoDataUrl(photo: Blob): Promise<string> {
  validatePhoto(photo)
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new PhotoInputError('사진을 읽지 못했습니다. 파일을 다시 선택해 주세요.'))
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new PhotoInputError('사진을 읽지 못했습니다. 파일을 다시 선택해 주세요.'))
    }
    reader.readAsDataURL(photo)
  })
  await new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new PhotoInputError('이미지가 손상되었거나 지원하지 않는 파일입니다. 다른 사진을 선택해 주세요.'))
    image.src = dataUrl
  })
  return dataUrl
}
