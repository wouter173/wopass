import { useEffect, useState } from 'react'
import * as crypto from '@/lib/client/crypto'
import { getSendSecret } from '@/lib/server/send-secret/functions'
import { unpackSecretPayload } from '@/lib/client/payload'

export function SendSecretDecrypt({
  id,
  initialRootSecret,
  version,
}: {
  id: string
  initialRootSecret: string | undefined
  version: number
}) {
  const [result, setResult] = useState<
    { state: 'error'; error: string } | { state: 'success'; text: string; files: Array<File> } | { state: 'pending' }
  >({
    state: 'pending',
  })

  const decrypt = async () => {
    try {
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
      <div>Result</div>
      {result.state === 'pending' && <button onClick={decrypt}>decrypt</button>}
      {result.state === 'success' && (
        <div>
          <span>{result.text}</span>
          {result.files.map((file) => (
            <DownloadAttachment file={file} />
          ))}
        </div>
      )}
      {result.state === 'error' && <span className="text-red-500">{result.error}</span>}
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
