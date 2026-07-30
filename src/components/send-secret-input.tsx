import * as crypto from '@/lib/client/crypto'
import { MAX_SECRET_CONTENT_BYTES, packSecretPayload } from '@/lib/client/payload'
import { cn } from '@/lib/cn'
import { estimateEncryptedSize, formatSize } from '@/lib/formatting'
import { postSendSecretData, postSendSecretId } from '@/lib/server/send-secret/functions'
import { CheckIcon, CopyIcon, InboxIcon, KeyRoundIcon, PlusIcon, Undo2Icon } from 'lucide-react'
import { useReducer, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FilePreview } from './file-preview'

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

type State = {
  text: string
  files: Array<File>
  result: { url: string } | null
}

type Action =
  | { type: 'addFiles'; files: Array<File> }
  | { type: 'removeFile'; idx: number }
  | { type: 'setText'; value: string }
  | { type: 'setResult'; result: { url: string } | null }
  | { type: 'reset' }

const defaultState = { files: [], text: '', result: null }

export function SendSecret() {
  const [{ result, text, files }, dispatch] = useReducer((state: State, action: Action) => {
    if (action.type === 'addFiles') return { ...state, files: [...state.files, ...action.files] }
    if (action.type === 'removeFile') return { ...state, files: state.files.filter((_, i) => i !== action.idx) }
    if (action.type === 'setResult') return { ...state, result: action.result }
    if (action.type === 'setText') return { ...state, text: action.value }
    /* if (action.type === reset) */ return defaultState
  }, defaultState)

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (newFiles) => dispatch({ type: 'addFiles', files: newFiles }),
    multiple: true,
    noClick: true,
    noKeyboard: true,
  })

  const size = estimateEncryptedSize(files.reduce((acc, cur) => (acc += cur.size), 0) + text.length)
  const overSized = size > MAX_SECRET_CONTENT_BYTES

  const [copied, setCopied] = useState(false)
  function copyUrl() {
    if (result) window.navigator.clipboard.writeText(result.url)

    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div className="pt-12 flex gap-2 flex-col">
      <h2 className=" text-zinc-300 text-lg font-semibold flex gap-2 items-center">Send secret</h2>

      {result ? (
        <>
          <div className="bg-zinc-800 border border-white/10 flex w-full justify-center mx-auto flex-col rounded-2xl p-3 gap-2">
            <h2 className="font-semibold">Quick link:</h2>
            <div className="flex gap-2">
              <div className="w-full border p-2 rounded-lg border-white/5 bg-zinc-700 wrap-anywhere">{result.url}</div>
              <button
                onClick={copyUrl}
                className="active:scale-95 transition-all focus:outline-none w-8 h-8 aspect-square shrink-0 focus-visible:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-800 text-sm shadow-2xs shadow-[#2D6074] bg-cyan-900 border-white/10 px-2 py-2 rounded-xl border font-medium hover:bg-cyan-800 flex items-center justify-center gap-1.5"
              >
                {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              </button>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'reset' })}
            className="active:scale-95 focus:outline-none focus-visible:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-950 text-sm shadow-2xs  bg-zinc-900 border-white/10 w-full px-2 py-2 rounded-xl border font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Undo2Icon size={16} />
            Another one
          </button>
        </>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()

            const { rootSecret, id } = await encryptAndSendInput(text, files)
            const url = buildUrl({ rootSecret, id })

            console.log("asdhilqwijeliqwhpeidobjkblhiopibkhjlio[ojkb l;op'jlnbk;opkjnb l")

            dispatch({ type: 'setResult', result: { url } })
          }}
        >
          <div
            {...getRootProps({ role: 'group', 'aria-label': 'Message and attachments' })}
            className={`overflow-clip has-[#text:focus]:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-950 relative w-full bg-zinc-800 border border-white/10 flex justify-center mx-auto rounded-2xl ${isDragActive ? 'border-zinc-800!' : ''}`}
          >
            {isDragActive ? (
              <div className="z-10 not-sr-only absolute -inset-1 grid place-items-center pointer-events-none bg-black/50 rounded-2xl">
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
                className="focus:outline-none rounded-2xl field-sizing-content min-h-40 max-h-80 resize-none px-3 py-3"
                value={text}
                onChange={(e) => dispatch({ type: 'setText', value: e.target.value })}
              />

              <div className="p-2 flex items-end gap-2">
                <div className="relative flex-1 min-w-0">
                  <ul className="w-full flex gap-2 overflow-scroll">
                    {files.map((file, index) => (
                      <div key={file.name + index} className="shrink-0">
                        <FilePreview file={file} onRemove={() => dispatch({ type: 'removeFile', idx: index })} />
                      </div>
                    ))}
                    <div className="w-10 shrink-0"></div>
                  </ul>
                  <div className="absolute h-full right-0 top-0 w-10 bg-linear-90 from-transparent to-zinc-800"></div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button
                    className="active:scale-95 focus:outline-none focus-visible:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-800 bg-zinc-800 h-min border shrink-0 border-white/5 hover:bg-zinc-700 w-fit text-xs px-2 py-1 rounded-2xl flex items-center gap-1"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      open()
                    }}
                  >
                    <PlusIcon size={12} />
                    Add file
                  </button>
                  <span className={cn('text-xs text-zinc-400 mr-1.5', overSized && 'text-red-400')}>
                    {formatSize(size)} / {formatSize(MAX_SECRET_CONTENT_BYTES)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            disabled={size === 0}
            className="active:scale-95 disabled:opacity-45 focus:outline-none focus-visible:ring-1 ring-cyan-300 ring-offset-2 ring-offset-zinc-950 text-sm shadow-2xs shadow-[#2D6074] bg-cyan-900 border-white/10 w-full px-2 py-2 rounded-xl border font-medium enabled:hover:bg-cyan-800 transition-all flex items-center justify-center gap-1.5"
          >
            <KeyRoundIcon size={16} />
            Encrypt
          </button>
        </form>
      )}
    </div>
  )
}
