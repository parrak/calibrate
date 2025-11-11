export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-content py-12">
      <article className="prose prose-lg max-w-none">
        {children}
      </article>
    </div>
  )
}

