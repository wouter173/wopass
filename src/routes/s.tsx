import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { Result, Schema } from 'effect'
import { SendSecretDecrypt } from '@/components/send-secret-decrypt'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/s')({ component: SendSecretDecryptPage })

const paramsSchema = Schema.Struct({ s: Schema.String, i: Schema.String, v: Schema.NumberFromString })
const decodeParamsSchema = Schema.decodeUnknownResult(paramsSchema)

function SendSecretDecryptPage() {
  const hash = useLocation({ select: (location) => location.hash })
  const navigate = useNavigate()
  const [params, setParams] = useState<{ id: string; initialRootSecret: string; version: number } | null>(null)

  // hash only exists on client
  useEffect(() => {
    ;(async () => {
      const hashParams = Object.fromEntries(new URLSearchParams(hash).entries())
      const result = decodeParamsSchema(hashParams)

      if (Result.isFailure(result)) return navigate({ to: '/', replace: true })

      setParams({ version: result.success.v, id: result.success.i, initialRootSecret: result.success.s })
    })()
  }, [])

  return (
    <div className="p-4 w-full md:w-2/5 mx-auto">
      {' '}
      <SendSecretDecrypt params={params} />
    </div>
  )
}
