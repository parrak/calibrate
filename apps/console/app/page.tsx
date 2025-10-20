import { redirect } from 'next/navigation'

export default function Home() {
  // For now, redirect to the demo project
  // In a real app, this would check user authentication and redirect to their last active project
  redirect('/p/demo')
}
