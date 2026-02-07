import { createHash, randomBytes } from 'node:crypto';

export const generateLoginKey = () => randomBytes(32).toString('hex');

export const hashLoginKey = (key: string) =>
	createHash('sha256').update(key).digest('hex');
