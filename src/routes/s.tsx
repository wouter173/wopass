import { createFileRoute, Navigate, useLocation } from '@tanstack/react-router'
import { Result, Schema } from 'effect'
import { SendSecretDecrypt } from '@/components/send-secret-decrypt'

export const Route = createFileRoute('/s')({ component: SendSecretDecryptPage })

const paramsSchema = Schema.Struct({ s: Schema.String, i: Schema.String, v: Schema.NumberFromString })
const decodeParamsSchema = Schema.decodeUnknownResult(paramsSchema)

function SendSecretDecryptPage() {
  const hash = useLocation({ select: (location) => location.hash })

  const params = Object.fromEntries(new URLSearchParams(hash).entries())
  const result = decodeParamsSchema(params)
  if (Result.isFailure(result)) return <Navigate to="/" replace />

  const { s: rootSecret, i: id, v: version } = result.success

  return (
    <div className="p-8 w-full md:w-2/5 mx-auto">
      <SendSecretDecrypt id={id} initialRootSecret={rootSecret} version={version} />
    </div>
  )
}
