import { cn } from '@/lib/cn'
import { Link } from '@tanstack/react-router'
import { UploadIcon } from 'lucide-react'

export function Header() {
  return (
    <header className="w-full bg-zinc-900 border-b border-white/5 flex justify-center">
      <div className="grid grid-cols-3 p-3 md:w-2/5 w-full mx-auto">
        <nav className="flex gap-4">
          <Link
            to={'/'}
            activeOptions={{ exact: true }}
            className={cn(
              'w-fit text-sm flex items-center justify-center gap-1  px-2 py-1 rounded-lg border',
              '[&.active]:border-white/5 [&.active]:text-white [&.active]:bg-zinc-800',
              'not-[&.active]:text-zinc-300 not-[&.active]:border-transparent',
            )}
          >
            <UploadIcon size={14} /> Send
          </Link>
          {/* <Link
            to={'/s'}
            className="w-fit text-sm flex items-center justify-center gap-1 not-[&.active]:text-zinc-300 not-[&.active]:border-transparent px-2 py-1 rounded-lg border [&.active]:border-white/5 [&.active]:text-white [&.active]:bg-zinc-800"
          >
            <InboxIcon size={14} /> Receive
          </Link> */}
        </nav>
        <div className="flex justify-center w-full">
          <h1 className="font-semibold">Wopass</h1>
        </div>
      </div>
    </header>
  )
}
