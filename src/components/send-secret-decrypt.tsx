import { useEffect, useState } from 'react'
import * as crypto from '@/lib/client/crypto'
import { getSendSecret } from '@/lib/server/send-secret/functions'
import { unpackSecretPayload } from '@/lib/client/payload'
import { KeyRoundIcon } from 'lucide-react'

export function SendSecretDecrypt({ params }: { params: { id: string; initialRootSecret: string | undefined; version: number } | null }) {
  const [result, setResult] = useState<
    { state: 'error'; error: string } | { state: 'success'; text: string; files: Array<File> } | { state: 'pending' }
  >({
    state: 'pending',
  })

  const decrypt = async () => {
    try {
      if (!params) throw new Error('Not found')
      const { id, initialRootSecret, version } = params

      if (version !== 1) throw new Error('Unsupported version')

      if (!initialRootSecret) throw new Error('no root secret') // TODO: handle

      const secret = crypto.base64UrlDecode(initialRootSecret)

      const accessToken = await crypto.hkdf({ salt: id, secret, info: 'wopass:message-access-token:v1', size: 32 })
      const encryptionSecret = await crypto.hkdf({ salt: id, secret, info: 'wopass:message-encryption-secret:v1', size: 32 })
      const password = crypto.base64UrlEncode(encryptionSecret)

      const { cipher } = await getSendSecret({ data: { id }, headers: { Authorization: `Bearer ${crypto.base64UrlEncode(accessToken)}` } })

      const payload = await crypto.decryptMessage({ cipher, password })
      const { text, files } = await unpackSecretPayload(payload)

      setResult({ state: 'success', text, files })
    } catch (e) {
      setResult({ state: 'error', error: e instanceof Error ? e.message : 'Already decrypted' })
    }
  }

  return (
    <>
      <div className="pt-12 flex gap-2 flex-col">
        <h2 className=" text-zinc-300 text-lg font-semibold flex gap-2 items-center">Decrypt secret</h2>
        <div className="bg-zinc-800 border border-white/10 flex w-full justify-center mx-auto flex-col rounded-2xl p-3 gap-2">
          {result.state === 'pending' && (
            <button
              className="active:scale-95 disabled:opacity-45 focus:outline-none focus-visible:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-800 text-sm shadow-2xs shadow-[#2D6074] bg-cyan-900 border-white/10 w-full px-2 py-2 rounded-lg border font-medium enabled:hover:bg-cyan-800 transition-all flex items-center justify-center gap-1.5"
              onClick={decrypt}
            >
              <KeyRoundIcon size={16} />
              decrypt
            </button>
          )}
          {result.state === 'success' && (
            <div>
              <span>{result.text}</span>
              {result.files.map((file) => (
                <DownloadAttachment file={file} />
              ))}
            </div>
          )}
          {result.state === 'error' && <span className="text-red-500">{result.error}</span>}
        </div>
      </div>
    </>
  )
}

function DownloadAttachment({ file }: { file: File }) {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)

    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return (
    <a href={url} download={file.name}>
      Download {file.name}
    </a>
  )
}
