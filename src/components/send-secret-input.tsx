import * as crypto from '@/lib/client/crypto'
import { postSendSecretData, postSendSecretId } from '@/lib/server/send-secret/functions'
import { InboxIcon, KeyRoundIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FilePreview } from './file-preview'
import { packSecretPayload } from '@/lib/client/payload'

async function encryptAndSendInput(text: string, files: Array<File>) {
  const rootSecret = crypto.generateRootSecret()
  const { id } = await postSendSecretId()

  const accessToken = await crypto.hkdf({ salt: id, secret: rootSecret, info: 'wopass:message-access-token:v1', size: 32 })
  const accessVerifier = await crypto.sha256(accessToken)

  const encryptionSecret = await crypto.hkdf({ salt: id, secret: rootSecret, info: 'wopass:message-encryption-secret:v1', size: 32 })
  const encryptionPassword = crypto.base64UrlEncode(encryptionSecret)

  const payload = await packSecretPayload({ text, files })
  const cipher = await crypto.encryptMessage({ payload, password: encryptionPassword })

  await postSendSecretData({ data: { id, cipher, accessVerifier: crypto.base64UrlEncode(accessVerifier) } })

  return { rootSecret: crypto.base64UrlEncode(rootSecret), id }
}

function buildUrl({ id, rootSecret }: { id: string; rootSecret: string }) {
  const params = new URLSearchParams({ i: id, s: rootSecret, v: '1' })
  const url = new URL('/s/', window.location.href)
  url.hash = params.toString()
  return url.toString()
}

export function SendSecret() {
  const [result, setResult] = useState<{ url: string } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [files, setFiles] = useState<Array<File>>([])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (newFiles) => {
      setFiles((currentFiles) => [...currentFiles, ...newFiles])
    },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  })

  return (
    <div className="pt-12 flex gap-2 flex-col">
      <h2 className=" text-zinc-300 text-lg font-semibold flex gap-2 items-center">Send secret</h2>

      {result ? (
        <span>{result.url}</span>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()

            const { rootSecret, id } = await encryptAndSendInput(textValue, files)

            setResult({ url: buildUrl({ rootSecret, id }) })
          }}
        >
          <div
            {...getRootProps({ role: 'group', 'aria-label': 'Message and attachments' })}
            className={`overflow-clip has-[#text:focus]:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-950 relative w-full bg-zinc-800 border border-white/10 flex justify-center mx-auto rounded-2xl ${isDragActive ? 'border-zinc-800!' : ''}`}
          >
            {isDragActive ? (
              <div className="not-sr-only absolute -inset-1 grid place-items-center pointer-events-none bg-black/50 rounded-2xl">
                <div className="flex flex-col gap-2 items-center text-zinc-400">
                  <InboxIcon size={22} />
                  <span className="text-sm">Drop to add file</span>
                </div>
              </div>
            ) : null}
            <input type="text" {...getInputProps({ className: 'sr-only' })} />
            <div className="w-full h-full flex gap-2 flex-col">
              <textarea
                name="text"
                id="text"
                placeholder="Start typing or drag in a file to continue"
                className="focus:outline-none rounded-2xl field-sizing-content min-h-40 resize-none px-3 py-3"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />

              <div className="p-2 flex items-end gap-2">
                <div className="relative flex-1 min-w-0">
                  <ul className="w-full flex gap-2 overflow-scroll">
                    {files.map((file, index) => (
                      <div key={file.name + index} className="shrink-0">
                        <FilePreview
                          file={file}
                          onRemove={() => setFiles((currentFiles) => currentFiles.filter((filterFile) => filterFile.name !== file.name))}
                        />
                      </div>
                    ))}
                    <div className="w-10 shrink-0"></div>
                  </ul>
                  <div className="absolute h-full right-0 top-0 w-10 bg-linear-90 from-transparent to-zinc-800"></div>
                </div>

                <button
                  className="focus:outline-none focus:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-800 bg-zinc-800 h-min border shrink-0 border-white/5 hover:bg-zinc-700 w-fit text-xs px-2.5 py-1.5 rounded-2xl flex items-center gap-1"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    open()
                  }}
                >
                  <PlusIcon size={12} />
                  Add file
                </button>
              </div>
            </div>
          </div>
          <button className="focus:outline-none focus:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-950 text-sm shadow-2xs shadow-[#2D6074] bg-cyan-900 border-white/10 w-full px-2 py-2 rounded-xl border font-medium hover:bg-cyan-800 transition-colors flex items-center justify-center gap-1.5">
            <KeyRoundIcon size={16} />
            Encrypt
          </button>
        </form>
      )}
    </div>
  )
}
