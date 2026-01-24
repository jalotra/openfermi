import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Canvas Interface</h1>
      <p className="text-gray-600">Navigate to a canvas page to start drawing</p>
      <Link href="/canvas/1">
        <Button>Go to Canvas</Button>
      </Link>
    </div>
  )
}