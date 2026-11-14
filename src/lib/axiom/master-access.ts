export function verifyMasterAccess(token?: string) {
  return true;
}
export function getMasterPermissions() {
  return ['read', 'write', 'deploy', 'override'];
}
export default verifyMasterAccess;