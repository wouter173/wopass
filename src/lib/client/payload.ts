import { Schema } from 'effect'

export const MAX_SECRET_CONTENT_BYTES = 2 * 1024 * 1024

const MAGIC = new Uint8Array([0x57, 0x4f, 0x50, 0x41, 0x53, 0x53, 0x01])
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const AttachmentMetadataSchema = Schema.Struct({
  name: Schema.String.check(Schema.isLengthBetween(1, 255)),
  type: Schema.String.check(Schema.isMaxLength(255)),
  size: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(MAX_SECRET_CONTENT_BYTES)),
})

const PayloadMetadataSchema = Schema.Struct({
  version: Schema.Literal(1),
  text: Schema.String,
  files: Schema.Array(AttachmentMetadataSchema),
})

const decodePayloadMetadata = Schema.decodeUnknownSync(Schema.fromJsonString(PayloadMetadataSchema))

export async function packSecretPayload({ text, files }: { text: string; files: Array<File> }) {
  const contentSize = encoder.encode(text).byteLength + files.reduce((total, file) => total + file.size, 0)
  if (contentSize > MAX_SECRET_CONTENT_BYTES) throw new Error('Text and files may contain at most 2 MB in total')

  const fileData = await Promise.all(files.map(async (file) => new Uint8Array(await file.arrayBuffer())))

  const metadata = {
    version: 1,
    text,
    files: files.map((file) => ({ name: file.name, type: file.type || 'application/octet-stream', size: file.size })),
  }

  const metadataBytes = encoder.encode(JSON.stringify(metadata))
  const headerSize = MAGIC.byteLength + 4
  const result = new Uint8Array(headerSize + metadataBytes.byteLength + fileData.reduce((total, data) => total + data.byteLength, 0))

  result.set(MAGIC, 0)
  new DataView(result.buffer).setUint32(MAGIC.byteLength, metadataBytes.byteLength)
  result.set(metadataBytes, headerSize)

  let offset = headerSize + metadataBytes.byteLength

  for (const data of fileData) {
    result.set(data, offset)
    offset += data.byteLength
  }

  return result
}

export function unpackSecretPayload(data: Uint8Array<ArrayBuffer>) {
  const metadataStart = MAGIC.byteLength + 4
  const metadataLength = new DataView(data.buffer, data.byteOffset + MAGIC.byteLength, 4).getUint32(0)
  const metadataEnd = metadataStart + metadataLength

  if (metadataEnd > data.byteLength) throw new Error('Invalid encrypted payload')
  const metadata = decodePayloadMetadata(decoder.decode(data.subarray(metadataStart, metadataEnd)))

  const files = []
  let offset = metadataEnd

  for (const file of metadata.files) {
    const end = offset + file.size
    if (end > data.byteLength) throw new Error('Invalid encrypted attachment')

    const bytes = data.slice(offset, end)
    files.push(new File([bytes.buffer], file.name, { type: file.type || 'application/octet-stream' }))

    offset = end
  }

  if (offset !== data.byteLength) throw new Error('Invalid encrypted payload length')
  return { text: metadata.text, files }
}
