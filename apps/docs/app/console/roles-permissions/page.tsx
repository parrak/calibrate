import Link from 'next/link'

export default function RolesPermissionsDocs() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/console" className="text-brand hover:underline text-sm mb-4 inline-block">
          ← Back to Console Docs
        </Link>

        <h1 className="text-4xl font-bold text-fg mb-4">Roles & Permissions</h1>
        <p className="text-xl text-mute mb-12">
          Understanding user roles and access control in Calibrate Console
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">User Roles</h2>
          <p className="text-fg mb-6">
            Calibrate uses role-based access control (RBAC) to manage permissions. Each user can have one of four roles:
          </p>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">👁️ Viewer</h3>
              <p className="text-mute text-sm mb-3">Read-only access to project data</p>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-green-500">✓</span>View catalog and products</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>View price changes (cannot approve/apply)</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>View pricing rules</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Use AI Assistant</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>View analytics</li>
                <li className="flex gap-2"><span className="text-red-500">✗</span>Cannot create or modify price changes</li>
                <li className="flex gap-2"><span className="text-red-500">✗</span>Cannot create or edit rules</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">✏️ Editor</h3>
              <p className="text-mute text-sm mb-3">Can create and review price changes, but not apply them</p>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-green-500">✓</span>All Viewer permissions</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Approve price changes</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Reject price changes</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Create pricing rules</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Edit pricing rules</li>
                <li className="flex gap-2"><span className="text-red-500">✗</span>Cannot apply price changes to platforms</li>
                <li className="flex gap-2"><span className="text-red-500">✗</span>Cannot delete rules</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">🔧 Admin</h3>
              <p className="text-mute text-sm mb-3">Full pricing management capabilities</p>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-green-500">✓</span>All Editor permissions</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Apply price changes to platforms</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Rollback applied changes</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Delete pricing rules</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Manage platform integrations</li>
                <li className="flex gap-2"><span className="text-red-500">✗</span>Cannot manage project settings</li>
                <li className="flex gap-2"><span className="text-red-500">✗</span>Cannot invite/remove users</li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-fg mb-3">👑 Owner</h3>
              <p className="text-mute text-sm mb-3">Complete control over the project</p>
              <ul className="space-y-2 text-fg text-sm">
                <li className="flex gap-2"><span className="text-green-500">✓</span>All Admin permissions</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Manage project settings</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Invite and remove team members</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Assign roles to users</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Delete the project</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Billing and subscription management</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Permission Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-surface border border-border rounded-xl overflow-hidden">
              <thead className="bg-bg">
                <tr className="text-left">
                  <th className="p-4 text-fg font-semibold">Action</th>
                  <th className="p-4 text-fg font-semibold text-center">Viewer</th>
                  <th className="p-4 text-fg font-semibold text-center">Editor</th>
                  <th className="p-4 text-fg font-semibold text-center">Admin</th>
                  <th className="p-4 text-fg font-semibold text-center">Owner</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { action: 'View Catalog', viewer: true, editor: true, admin: true, owner: true },
                  { action: 'View Price Changes', viewer: true, editor: true, admin: true, owner: true },
                  { action: 'Approve Price Changes', viewer: false, editor: true, admin: true, owner: true },
                  { action: 'Apply Price Changes', viewer: false, editor: false, admin: true, owner: true },
                  { action: 'Rollback Changes', viewer: false, editor: false, admin: true, owner: true },
                  { action: 'Create Rules', viewer: false, editor: true, admin: true, owner: true },
                  { action: 'Delete Rules', viewer: false, editor: false, admin: true, owner: true },
                  { action: 'Manage Integrations', viewer: false, editor: false, admin: true, owner: true },
                  { action: 'Invite Users', viewer: false, editor: false, admin: false, owner: true },
                  { action: 'Delete Project', viewer: false, editor: false, admin: false, owner: true },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-bg/50' : ''}>
                    <td className="p-4 text-fg">{row.action}</td>
                    <td className="p-4 text-center">{row.viewer ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}</td>
                    <td className="p-4 text-center">{row.editor ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}</td>
                    <td className="p-4 text-center">{row.admin ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}</td>
                    <td className="p-4 text-center">{row.owner ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-fg mb-6">Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Principle of Least Privilege</div>
                  <div className="text-sm text-mute">Grant users the minimum permissions they need to perform their job.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Separation of Duties</div>
                  <div className="text-sm text-mute">Have different team members approve and apply price changes for additional oversight.</div>
                </div>
              </div>
            </div>
            <div className="bg-bg border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-fg mb-1">Regular Audits</div>
                  <div className="text-sm text-mute">Periodically review user roles and remove access for team members who no longer need it.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
