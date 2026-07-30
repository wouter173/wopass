import { formatSize } from '@/lib/formatting'
import { XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  if (file.type.startsWith('image/') && previewUrl) {
    return (
      <div className="relative size-16 overflow-clip grid place-items-center border border-white/5 rounded-xl" aria-hidden="true">
        <img className="object-cover block size-full relative" src={previewUrl} alt={`Preview of ${file.name}`} />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 size-4 bg-white text-black rounded-full grid place-items-center opacity-80 hover:opacity-100"
        >
          <XIcon size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-700 relative pr-6 h-16 w-fit min-w-16 overflow-clip flex border border-white/5 rounded-xl" aria-hidden="true">
      <div className="size-16 border-r border-r-white/5 grid place-items-center text-xl">📄</div>
      <div className="p-2 flex flex-col justify-center">
        <span className="text-zinc-300 text-sm">{file.name}</span>

        <span className="text-zinc-400 text-sm">
          {file.type.split('/')[1]} {formatSize(file.size)}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 size-4 bg-white text-black rounded-full grid place-items-center opacity-80 hover:opacity-100"
      >
        <XIcon size={12} />
      </button>
    </div>
  )
}
