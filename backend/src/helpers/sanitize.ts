type Primitive = string | number | boolean | null | undefined;
type PlainObject = { [k: string]: any };

/** Remove HTML tags and dangerous attributes and schemes, collapse whitespace. */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return String(input);

  try {
    // 1) Remove null/control characters (keep newline, tab)
    let s = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, '');

    // 2) Remove script, svg, math blocks entirely (case-insensitive, multiline)
    s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    s = s.replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, '');
    s = s.replace(/<math[\s\S]*?>[\s\S]*?<\/math>/gi, '');

    // 3) Remove event-handler attributes (on*)
    //    e.g. <tag onclick="..."> or <tag onmouseover='...'>
    //    We remove attributes like: onabc=... (single or double quotes or no quotes)
    s = s.replace(/[\s\n\r]+on[a-zA-Z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 4) Remove style attributes entirely
    s = s.replace(/[\s\n\r]+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 5) Neutralize href/src attributes with dangerous schemes:
    //    Find href/src="..."; if value starts with javascript:|data:|vbscript: (ignoring whitespace/newlines), remove the whole attribute.
    s = s.replace(
      /[\s\n\r]+(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      (_match, g1, g2, g3) => {
        const val = String(g1 ?? g2 ?? g3 ?? '').trim().toLowerCase();
        if (val.startsWith('javascript:') || val.startsWith('data:') || val.startsWith('vbscript:')) {
          return '';
        }
        // keep safe href/src but we will strip tags completely later, so just remove attribute to be safe
        return '';
      }
    );

    // 6) Remove any remaining tags (strip <...>)
    s = s.replace(/<[^>]*>/g, '');

    // 7) Normalize whitespace
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  } catch (err) {
    // fallback conservative approach
    return String(input).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

/** Recursively sanitize objects/arrays/primitives. */
export function sanitizeInput<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeString(value) as unknown as T;
  if (typeof value === 'number' || typeof value === 'boolean') return value as unknown as T;
  if (Array.isArray(value)) return (value.map((v) => sanitizeInput(v)) as unknown) as T;
  if (typeof value === 'object') {
    const out: PlainObject = {};
    for (const [k, v] of Object.entries(value as PlainObject)) {
      if (k === '__proto__' || k === 'prototype' || k === 'constructor') continue;
      out[k] = sanitizeInput(v);
    }
    return out as T;
  }
  return value;
}
