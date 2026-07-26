import { createFileRoute, useLocation } from '@tanstack/react-router'
import { Schema } from 'effect'
import * as crypto from '@/lib/client/crypto'
import { useState } from 'react'
import { getSendSecret } from '@/lib/server/send-secret/functions'

export const Route = createFileRoute('/s')({
  component: SendSecretDecryptComponent,
})

const paramsSchema = Schema.Struct({ s: Schema.String, i: Schema.String })

const decodeParamsSchema = Schema.decodeUnknownSync(paramsSchema)

function SendSecretDecryptComponent() {
  const hash = useLocation({ select: (location) => location.hash })
  const [result, setResult] = useState<string | null>(null)

  const params = Object.fromEntries(new URLSearchParams(hash).entries())
  const { s: encodedRootSecret, i: id } = decodeParamsSchema(params)

  const decrypt = async () => {
    const rootSecret = crypto.base64UrlDecode(encodedRootSecret)

    const accessToken = await crypto.hkdf({ salt: id, secret: rootSecret, info: 'wopass:message-access-token:v1', size: 32 })
    const encryptionSecret = await crypto.hkdf({ salt: id, secret: rootSecret, info: 'wopass:message-encryption-secret:v1', size: 32 })
    const password = crypto.base64UrlEncode(encryptionSecret)

    const { cipher } = await getSendSecret({ data: { id }, headers: { Authorization: `Bearer ${crypto.base64UrlEncode(accessToken)}` } })

    const text = await crypto.decryptMessage({ cipher, password })

    setResult(text)
  }

  return (
    <>
      <div>Result</div>
      {result ? <span>{result}</span> : <button onClick={decrypt}>decrypt</button>}
    </>
  )
}
