/**
 * Penpot exporter wire format.
 *
 * design.penpot.app OpenAPI (2.19) has no export-shapes RPC. That method is
 * still the proposal in penpot/penpot#10008. The app renders with
 * POST {api}/api/export, body application/transit+json, command :export-shapes.
 * The exporter reads the auth-token cookie and, when :is-wasm is true, forwards
 * that value as Authorization: Bearer to get-page. Access tokens are Bearer
 * credentials, not session cookies, so the access-token path sets is-wasm.
 * A real browser session cookie (PENPOT_AUTH_TOKEN) uses the browser renderer
 * so image fills match the canvas.
 */

export type Keyword = { readonly kind: 'kw'; readonly name: string };
export type TransitUuid = { readonly kind: 'uuid'; readonly id: string };

export const kw = (name: string): Keyword => ({ kind: 'kw', name });
export const uuid = (id: string): TransitUuid => ({ kind: 'uuid', id });

const EXPORT_TYPES = new Set(['png', 'jpeg', 'webp', 'svg', 'pdf']);

export type ExportType = 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf';

export function normalizeExportType(type: string | undefined): ExportType {
  const value = (type || 'png').toLowerCase();
  const normalized = value === 'jpg' ? 'jpeg' : value;
  if (!EXPORT_TYPES.has(normalized)) {
    throw new Error(`Unsupported export type "${type}". Use png, jpeg, webp, svg, or pdf.`);
  }
  return normalized as ExportType;
}

export function exportUsesWasm(sessionCookie: string | undefined): boolean {
  return !sessionCookie?.trim();
}

export function sanitizeExportName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return (cleaned || 'board').slice(0, 80);
}

export function buildExportParams(input: {
  profileId: string;
  fileId: string;
  pageId: string;
  objectId: string;
  type: ExportType;
  scale: number;
  name: string;
  isWasm: boolean;
}): Record<string, unknown> {
  if (!(input.scale > 0) || input.scale > 4) {
    throw new Error('scale must be greater than 0 and at most 4');
  }

  return {
    cmd: kw('export-shapes'),
    wait: true,
    'profile-id': uuid(input.profileId),
    'is-wasm': input.isWasm,
    exports: [
      {
        'file-id': uuid(input.fileId),
        'page-id': uuid(input.pageId),
        'object-id': uuid(input.objectId),
        type: kw(input.type),
        scale: input.scale,
        suffix: '',
        name: sanitizeExportName(input.name),
      },
    ],
  };
}

function isKeyword(value: unknown): value is Keyword {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Keyword).kind === 'kw' &&
    typeof (value as Keyword).name === 'string'
  );
}

function isUuid(value: unknown): value is TransitUuid {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as TransitUuid).kind === 'uuid' &&
    typeof (value as TransitUuid).id === 'string'
  );
}

/** Encode the small json-verbose subset the exporter accepts. */
export function encodeTransitVerbose(value: unknown): string {
  return JSON.stringify(walkEncode(value));
}

function walkEncode(value: unknown): unknown {
  if (isKeyword(value)) {
    return `~:${value.name}`;
  }
  if (isUuid(value)) {
    return `~u${value.id}`;
  }
  if (Array.isArray(value)) {
    return value.map(walkEncode);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[`~:${key}`] = walkEncode(child);
    }
    return out;
  }
  return value;
}

/** Decode json-verbose transit. Keywords and uuids come back as plain strings. */
export function decodeTransitVerbose(text: string): unknown {
  return walkDecode(JSON.parse(text) as unknown);
}

function walkDecode(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('~:')) {
      return value.slice(2);
    }
    if (value.startsWith('~u')) {
      return value.slice(2);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(walkDecode);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const decodedKey = key.startsWith('~:') ? key.slice(2) : key;
      out[decodedKey] = walkDecode(child);
    }
    return out;
  }
  return value;
}

export interface ExportResource {
  id?: string;
  name?: string;
  filename?: string;
  uri?: string;
  mtype?: string;
  hint?: string;
  explain?: string;
  type?: string;
}

export function asExportResource(decoded: unknown): ExportResource {
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw new Error('Penpot export returned a non-object body');
  }
  return decoded as ExportResource;
}

export function resolveExportUri(apiUrl: string, uri: string): string {
  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }
  const base = apiUrl.replace(/\/$/, '');
  return `${base}/${uri.replace(/^\//, '')}`;
}
