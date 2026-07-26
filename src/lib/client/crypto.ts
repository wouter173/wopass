import { createClientOnlyFn } from '@tanstack/react-start'
import * as pgp from 'openpgp'

export const generateRootSecret = createClientOnlyFn((): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(32))
})

export const encryptMessage = createClientOnlyFn(async ({ text, password }: { text: string; password: string }) => {
  const message = await pgp.createMessage({ text })
  return await pgp.encrypt({ message, passwords: [password], format: 'armored' })
})

export const decryptMessage = createClientOnlyFn(async ({ cipher, password: passphrase }: { cipher: string; password: string }) => {
  const message = await pgp.readMessage({ armoredMessage: cipher })
  const { data } = await pgp.decrypt({ message, passwords: [passphrase] })
  return `${data}`
})

export const sha256 = createClientOnlyFn(async (input: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> => {
  const inputCopy = new Uint8Array(input.byteLength)
  inputCopy.set(input)

  const digest = await globalThis.crypto.subtle.digest('SHA-256', inputCopy)

  return new Uint8Array(digest)
})

export const base64UrlEncode = createClientOnlyFn((bytes: Uint8Array<ArrayBufferLike>): string => {
  return bytes.toBase64({ alphabet: 'base64url', omitPadding: true })
})

export const base64UrlDecode = createClientOnlyFn((value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[A-Za-z0-9_-]*$/u.test(value)) {
    throw new TypeError('Invalid base64url string')
  }

  return Uint8Array.fromBase64(value, { alphabet: 'base64url', lastChunkHandling: 'loose' })
})

type BytesLike = Uint8Array<ArrayBufferLike> | string

const bytes = createClientOnlyFn((value: BytesLike): Uint8Array<ArrayBuffer> => {
  const encoder = new TextEncoder()
  return new Uint8Array(typeof value === 'string' ? encoder.encode(value) : value)
})

export const hkdf = createClientOnlyFn(
  async (params: {
    secret: Uint8Array<ArrayBufferLike>
    salt: BytesLike
    info: BytesLike
    size?: number
  }): Promise<Uint8Array<ArrayBuffer>> => {
    const { secret, salt, info, size = 32 } = params

    const key = await crypto.subtle.importKey('raw', bytes(secret), 'HKDF', false, ['deriveBits'])
    const result = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: bytes(salt), info: bytes(info) }, key, size * 8)

    return new Uint8Array(result)
  },
)
