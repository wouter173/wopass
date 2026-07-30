import { SendSecret } from '@/components/send-secret-input'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="p-4 w-full md:w-2/5 mx-auto">
      <SendSecret />
    </div>
  )
}
