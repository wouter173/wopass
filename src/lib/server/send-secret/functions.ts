import { createServerFn } from '@tanstack/react-start'
import { Schema } from 'effect'
import * as db from './db'
import { getRequestHeader } from '@tanstack/react-start/server'
import { createHash } from 'node:crypto'

export const postSendSecretId = createServerFn({ method: 'POST' }).handler(async () => {
  return await db.createSendSecretId()
})

const postSendSchema = Schema.Struct({
  id: Schema.String,
  cipher: Schema.String,
  accessVerifier: Schema.String,
})

export const postSendSecretData = createServerFn({ method: 'POST' })
  .validator((data: typeof postSendSchema.Type) => Schema.decodeUnknownPromise(postSendSchema)(data))
  .handler(async ({ data: { id, cipher, accessVerifier } }) => {
    await db.setSendSecretData({ id, cipher, accessVerifier })
  })

const getSendSecretSchema = Schema.Struct({
  id: Schema.String,
})

export const getSendSecret = createServerFn({ method: 'POST' })
  .validator((data: typeof getSendSecretSchema.Type) => Schema.decodeUnknownPromise(getSendSecretSchema)(data))
  .handler(async ({ data: { id } }) => {
    const accessToken = getRequestHeader('Authorization')?.split('Bearer ')[1]
    if (!accessToken) throw new Error('No Authorization')

    const sendSecret = await db.getSendSecret(id)
    if (sendSecret?.state !== 'ready') throw new Error('Illegal State')
    const accessVerifier = createHash('sha256').update(Buffer.from(accessToken, 'base64url')).digest('base64url')

    if (sendSecret.accessVerifier !== accessVerifier) throw new Error('Illegal AccessToken')

    await db.deleteSendSecret(id)

    return { cipher: sendSecret.cipher }
  })
