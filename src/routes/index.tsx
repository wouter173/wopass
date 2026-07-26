import { SendText } from '@/components/send-text'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <SendText />
    </div>
  )
}
