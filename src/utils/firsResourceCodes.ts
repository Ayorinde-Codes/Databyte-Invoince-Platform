export type FirsCodeEntry =
  | string
  | {
      hscode?: string;
      code?: string;
      value?: string;
      name?: string;
      description?: string;
    };

export const getHsnCodeValue = (code: FirsCodeEntry): string => {
  if (typeof code === 'string') return code;
  return code.hscode || code.code || code.value || code.name || '';
};

export const getHsnCodeDisplay = (code: FirsCodeEntry): string => {
  if (typeof code === 'string') return code;
  const codeValue = getHsnCodeValue(code);
  const description = code.description ? ` - ${code.description}` : '';
  return codeValue + description;
};

export const getHsnProductCategory = (code: FirsCodeEntry): string | undefined => {
  if (typeof code === 'string') return undefined;
  return code.description;
};

export const getServiceCodeValue = (code: FirsCodeEntry): string => {
  if (typeof code === 'string') return code;
  return code.code || code.value || code.name || '';
};

export const getServiceCodeDisplay = (code: FirsCodeEntry): string => {
  if (typeof code === 'string') return code;
  const codeValue = getServiceCodeValue(code);
  const description = code.description ? ` - ${code.description}` : '';
  return codeValue + description;
};

export const getServiceCategory = (code: FirsCodeEntry): string | undefined => {
  if (typeof code === 'string') return undefined;
  return code.description;
};

export const getQuantityCodeValue = (code: FirsCodeEntry): string => {
  if (typeof code === 'string') return code;
  return code.code || code.value || code.name || '';
};

export const getQuantityCodeDisplay = (code: FirsCodeEntry): string => {
  if (typeof code === 'string') return code;
  const codeValue = getQuantityCodeValue(code);
  const name = code.name && code.name !== codeValue ? ` (${code.name})` : '';
  const description = code.description ? ` - ${code.description}` : '';
  return `${codeValue}${name}${description}`;
};
