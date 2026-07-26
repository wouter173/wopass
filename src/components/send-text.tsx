import * as crypto from '@/lib/client/crypto'
import { postSendSecretData, postSendSecretId } from '@/lib/server/send-secret/functions'
import { useRef, useState } from 'react'

export function SendText() {
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [result, setResult] = useState<{ rootSecret: string; id: string } | null>(null)

  const params = new URLSearchParams({
    i: result?.id ?? '',
    s: result?.rootSecret ?? '',
    v: '1',
  })

  const url = new URL('/s/', window.location.href)
  url.hash = params.toString()

  return (
    <>
      <div>Hello world</div>
      <form
        onSubmit={async (e) => {
          e.preventDefault()

          const text = textRef.current?.value ?? ''

          const rootSecret = crypto.generateRootSecret()

          const { id } = await postSendSecretId()

          const accessToken = await crypto.hkdf({ salt: id, secret: rootSecret, info: 'wopass:message-access-token:v1', size: 32 })
          const accessVerifier = await crypto.sha256(accessToken)

          const encryptionSecret = await crypto.hkdf({ salt: id, secret: rootSecret, info: 'wopass:message-encryption-secret:v1', size: 32 })
          const encryptionPassword = crypto.base64UrlEncode(encryptionSecret)

          const cipher = await crypto.encryptMessage({ text, password: encryptionPassword })

          await postSendSecretData({ data: { id, cipher, accessVerifier: crypto.base64UrlEncode(accessVerifier) } })

          setResult({ rootSecret: crypto.base64UrlEncode(rootSecret), id })
        }}
      >
        <textarea ref={textRef} name="text" id=""></textarea>
        <button>submit</button>
      </form>
      {result && <span>{url.toString()}</span>}
    </>
  )
}
