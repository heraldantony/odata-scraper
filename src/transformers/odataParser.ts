// src/transformers/odataParser.ts

export function normalizeODataRequest(body: string | undefined): string {
    if (!body || typeof body !== 'string') {
        return body || '';
    }

    // UI5 generates boundaries that look like "batch_id-1615234234-123" or "batch_1234-5678-90ab"
    // We must replace these random IDs with static text so the payload is deterministic.
    
    let normalizedBody = body;

    // 1. Normalize batch boundaries (e.g., --batch_12345 or boundary=batch_12345)
    normalizedBody = normalizedBody.replace(/batch_[a-zA-Z0-9\-]+/g, 'batch_STATIC_NORMALIZED');

    // 2. Normalize changeset boundaries (nested inside POST batches)
    normalizedBody = normalizedBody.replace(/changeset_[a-zA-Z0-9\-]+/g, 'changeset_STATIC_NORMALIZED');

    // 3. (Optional) Strip random UI5 cache-buster tokens if they appear in your payloads
    normalizedBody = normalizedBody.replace(/sap-cb=\d+/g, 'sap-cb=STATIC');

    return normalizedBody;
}
