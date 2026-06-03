/**
 * Turn raw Hoptool/FIRS validation strings into user-facing messages.
 */
export const formatHoptoolValidationMessage = (raw?: string | null): string | undefined => {
  if (!raw || !raw.trim()) {
    return undefined;
  }

  const message = raw.trim();
  const lower = message.toLowerCase();

  const lineHsnMatch = message.match(/invoiceline\[(\d+)\]\.hsncode/i);
  if (lineHsnMatch) {
    const lineNumber = Number(lineHsnMatch[1]) + 1;
    if (lower.includes('valid hsn') || lower.includes('format')) {
      return `Line ${lineNumber}: HSN code must be in FIRS format 0000.00 (for example 1234.56). Edit the HSN on that line item and validate again.`;
    }
  }

  if (lower.includes('hsncode') && (lower.includes('valid') || lower.includes('format'))) {
    return 'HSN code must be in FIRS format 0000.00 (for example 1234.56). Update the HSN on each invoice line and validate again.';
  }

  const lineMatch = message.match(/invoiceline\[(\d+)\]/i);
  if (lineMatch) {
    const lineNumber = Number(lineMatch[1]) + 1;
    const rest = message
      .replace(/^invoicerequest\.invoice\./i, '')
      .replace(/invoiceline\[\d+\]\.?/i, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[._]/g, ' ')
      .trim();

    if (rest) {
      return `Line ${lineNumber}: ${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
    }
  }

  return message
    .replace(/^invoicerequest\.invoice\./i, '')
    .replace(/invoiceline\[(\d+)\]/gi, (_, index: string) => `Line ${Number(index) + 1}`)
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const resolveValidationErrorMessage = (
  message?: string,
  data?: unknown
): string => {
  const payload =
    data && typeof data === 'object'
      ? (data as { ok?: boolean; description?: string })
      : undefined;

  if (payload?.ok === false && payload.description) {
    return formatHoptoolValidationMessage(payload.description) ?? payload.description;
  }

  return formatHoptoolValidationMessage(message) ?? message ?? 'Validation failed';
};
