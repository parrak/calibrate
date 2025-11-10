export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
      <article className="prose prose-lg max-w-none">
        {children}
      </article>
    </div>
  )
}

