const getEnv = (key: 'NEXT_PUBLIC_API_BASE_URL' | 'NEXT_PUBLIC_API_URL', fallback: string) => {
  const value = process.env[key];
  return value != null && value.length > 0 ? value : fallback;
};

const apiBase = getEnv('NEXT_PUBLIC_API_BASE_URL', getEnv('NEXT_PUBLIC_API_URL', ''));
export const env = {
  apiBaseUrl: apiBase || '/v1'
};
