export function formatSize(size: number) {
  const format = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2))

  if (size >= 1024 * 1024) {
    return `${format(size / (1024 * 1024))}MB`
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(0)}KB`
  }

  return `${size}B`
}

// pgp adds a lot of extra size to a n encrypted payload: ASCII armor headers, checksum and wrapped-line newlines.
export function estimateEncryptedSize(payloadSize: number) {
  if (payloadSize === 0) return 0

  const estimatedOpenPgpOverhead = 200
  const binarySize = payloadSize + estimatedOpenPgpOverhead
  const base64Size = 4 * Math.ceil(binarySize / 3)

  const armorOverhead = 150 + Math.ceil(base64Size / 64)

  return base64Size + armorOverhead
}
