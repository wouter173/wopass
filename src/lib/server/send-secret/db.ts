import { createServerOnlyFn } from '@tanstack/react-start'
import { valkey } from '../valkey'
import { Schema, Struct } from 'effect'
import { nanoid } from '@/lib/nanoid'

const sendSecretDataSchema = Schema.Struct({
  cipher: Schema.String,
  accessVerifier: Schema.String,
})

const sendSecretDataWithIdSchema = sendSecretDataSchema.mapFields(Struct.assign({ id: Schema.String }))

const sendSecretSchema = Schema.Union([
  Schema.Struct({
    state: Schema.Literals(['ready']),
    ...sendSecretDataSchema.fields,
  }),
  Schema.Struct({
    state: Schema.Literal('pending'),
  }),
])

const sendSecretKey = (id: string) => `secret:send:${id}`

export const createSendSecretId = createServerOnlyFn(async () => {
  const id = nanoid()
  if (await getSendSecret(id)) throw new Error('Collision')

  const data = sendSecretSchema.make({ state: 'pending' })
  await valkey.set(sendSecretKey(id), JSON.stringify(data), 'EX', 86_400)

  return { id }
})

export const setSendSecretData = createServerOnlyFn(async ({ id, cipher, accessVerifier }: typeof sendSecretDataWithIdSchema.Type) => {
  const sendSecret = await getSendSecret(id)

  if (!sendSecret || sendSecret.state !== 'pending') throw new Error('Illegal state')

  const data = sendSecretSchema.make({ state: 'ready', cipher, accessVerifier })
  await valkey.set(sendSecretKey(id), JSON.stringify(data), 'EX', 86_400)
})

export const getSendSecret = createServerOnlyFn(async (id: string) => {
  const payload = await valkey.get(sendSecretKey(id))
  if (!payload) return null

  try {
    return Schema.decodeUnknownSync(Schema.fromJsonString(sendSecretSchema))(payload)
  } catch (e) {
    console.error(e)
    return null
  }
})

export const deleteSendSecret = createServerOnlyFn(async (id: string) => {
  await valkey.del(sendSecretKey(id))
})
