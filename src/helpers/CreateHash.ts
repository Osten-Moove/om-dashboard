import * as crypto from 'crypto';
export function createUniqueHash(params: Array<string>) {
  if (!params || params.length === 0) return '';
  const hashParams = params.join(',');
  return crypto.createHash('sha256').update(hashParams).digest('hex');
}
