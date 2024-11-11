import crypto from 'crypto';
export function createUniqueHash(params: Array<string>) {
  const hashParams = params.join(',');
  return crypto.createHash('sha256').update(hashParams).digest('hex');
}
