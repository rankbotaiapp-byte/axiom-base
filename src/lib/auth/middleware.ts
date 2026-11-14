export function authMiddleware(req: any) {
  return null;
}
export async function getSession() {
  return { user: { id: 'admin', email: 'eric@axiom.local', role: 'owner' } };
}
export default authMiddleware;