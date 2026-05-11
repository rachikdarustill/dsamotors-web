export function useApi() {
  const config = useRuntimeConfig();

  const get = async <T>(path: string, query?: Record<string, string>) => {
    return await $fetch<T>(path, {
      baseURL: config.public.apiBase,
      query,
    });
  };

  const post = async <T>(path: string, body?: Record<string, unknown>) => {
    return await $fetch<T>(path, {
      method: 'POST',
      baseURL: config.public.apiBase,
      body,
    });
  };

  return { get, post };
}
