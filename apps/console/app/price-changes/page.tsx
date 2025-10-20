import { redirect } from 'next/navigation'

export default function PriceChanges() {
  // Redirect to the project-scoped price changes page
  redirect('/p/demo/price-changes')
}
