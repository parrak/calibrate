// Native fetch is available in Node 18+

async function testAuth() {
    const apiBase = 'http://localhost:3000';
    const internal = 'dev-console-internal-token';
    const userId = 'test-user-id';
    const roles = ['admin'];
    const tenantId = 'demo-tenant';

    console.log('Testing auth with:', { apiBase, internal, userId });

    try {
        const res = await fetch(`${apiBase}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-console-auth': internal },
            body: JSON.stringify({ userId, roles, tenantId }),
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Error:', err);
    }
}

testAuth();
