import { useId, useState } from 'react'
import { useProductPhotos, useUploadProductPhoto } from '../api/hooks'
import { loadPhotoUrl, readPhotoDataUrl } from '../lib/productPhoto'
import { Hint } from './ui'

export function PhotoEditor({ itemId }: { readonly itemId: string }) {
  const photos = useProductPhotos()
  const upload = useUploadProductPhoto()
  const inputId = useId()
  const [url, setUrl] = useState('')
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const photo = photos.data?.find((candidate) => candidate.item_id === itemId)
  const currentSource = photo
    ? `/api/v1/inventory/${encodeURIComponent(itemId)}/photo?v=${encodeURIComponent(photo.version)}&reload=${reloadVersion}`
    : null
  const source = draft ?? currentSource
  const busy = loading || upload.isPending

  function clearFeedback() {
    setError(null)
    setSuccess(false)
    upload.reset()
  }

  async function preparePhoto(getPhoto: () => Promise<Blob>) {
    clearFeedback()
    setDraft(null)
    setLoading(true)
    try {
      setDraft(await readPhotoDataUrl(await getPhoto()))
    } catch (cause) {
      if (!(cause instanceof Error)) throw cause
      setError(cause.message)
    } finally {
      setLoading(false)
    }
  }

  async function reloadCurrentPhoto() {
    clearFeedback()
    setDraft(null)
    setFailedSource(null)
    setLoading(true)
    try {
      const result = await photos.refetch()
      if (result.error) setError(result.error.message)
      else setReloadVersion((version) => version + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="field" style={{ gap: 16, wordBreak: 'keep-all' }} aria-busy={busy}>
      <div className="thumb is-lg">
        {source && source !== failedSource ? (
          <img
            src={source}
            alt={draft ? '저장 전 상품 사진 미리보기' : '현재 등록된 상품 사진'}
            onError={() => {
              setFailedSource(source)
              setError('등록 사진을 표시하지 못했습니다. 기존 등록 사진을 다시 불러오거나 새 파일을 선택해 주세요.')
            }}
          />
        ) : (
          <span>{photos.isPending ? '사진 불러오는 중…' : source ? '사진을 표시할 수 없어요' : '등록된 사진이 없어요'}</span>
        )}
      </div>
      <button type="button" className="btn" disabled={busy || photos.isFetching} onClick={() => void reloadCurrentPhoto()}>
        기존 등록 사진 불러오기
      </button>
      <div className="field">
        <label htmlFor={inputId}>사진 파일 · JPG, PNG, WebP · 1MB 이하</label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void preparePhoto(() => Promise.resolve(file))
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={`${inputId}-url`}>이미지 URL</label>
        <input
          id={`${inputId}-url`}
          type="text"
          inputMode="url"
          value={url}
          placeholder="https://example.com/photo.jpg"
          disabled={busy}
          onChange={(event) => {
            setUrl(event.target.value)
            setDraft(null)
            clearFeedback()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              if (!busy && url.trim()) void preparePhoto(() => loadPhotoUrl(url))
            }
          }}
        />
        <button type="button" className="btn" disabled={busy || !url.trim()} onClick={() => void preparePhoto(() => loadPhotoUrl(url))}>
          {loading ? '불러오는 중…' : '이미지 URL 불러오기'}
        </button>
      </div>
      <Hint>미리보기를 확인한 뒤 사진 저장을 눌러 주세요.</Hint>
      <div role="alert">
        {error || upload.error || photos.error ? (
          <p className="error-bar">{error ?? upload.error?.message ?? photos.error?.message}</p>
        ) : null}
      </div>
      <div role="status" aria-live="polite">
        {loading ? '사진을 불러오는 중입니다…' : upload.isPending ? '사진을 저장하는 중입니다…' : success ? '사진을 저장했습니다.' : draft ? '미리보기입니다. 사진 저장을 눌러야 반영됩니다.' : null}
      </div>
      <button
        type="button"
        className="btn is-primary"
        disabled={busy || !draft || draft === failedSource}
        onClick={() => {
          if (!draft) return
          clearFeedback()
          upload.mutate({ id: itemId, image_data_url: draft }, { onSuccess: () => {
            setDraft(null)
            setSuccess(true)
          } })
        }}
      >
        {upload.isPending ? '저장 중…' : '사진 저장'}
      </button>
    </div>
  )
}
