'use client'
import { useEffect, useState } from 'react'

export default function ProjectPriceChanges({ params }: { params: { slug: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Price Changes</h1>
      <p className="text-gray-600">
        Price changes for project: {params.slug}
      </p>
      <p className="text-sm text-gray-500 mt-4">
        This page is under construction. The full price changes interface will be available soon.
      </p>
    </div>
  )
}
