// src/MatcherEngine.ts
import crypto from 'crypto';
import { normalizeODataRequest } from './transformers/odataParser';

export class MatcherEngine {
  generateHash(method: string, path: string, query: object, body: any): string {
    
    // Sort query parameters alphabetically
    const sortedQuery = Object.keys(query).sort().map(k => `${k}=${(query as any)[k]}`).join('&');
    
    // Convert body to string if it isn't already
    const stringBody = typeof body === 'string' ? body : JSON.stringify(body || {});

    // APPY THE NORMALIZER BEFORE HASHING
    const cleanBody = path.endsWith('$batch') 
        ? normalizeODataRequest(stringBody) 
        : stringBody;
    
    const inputStr = `${method.toUpperCase()}|${path}|${sortedQuery}|${cleanBody}`;
    
    return crypto.createHash('sha256').update(inputStr).digest('hex');
  }
}
