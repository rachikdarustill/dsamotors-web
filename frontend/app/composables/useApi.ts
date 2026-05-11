export function useApi() {
  const config = useRuntimeConfig();
  const baseURL = import.meta.server ? config.apiInternalBase : config.public.apiBase;

  const get = async <T>(path: string, query?: Record<string, string>) => {
    return await $fetch<T>(path, {
      baseURL,
      query,
    });
  };

  const post = async <T>(path: string, body?: Record<string, unknown>) => {
    return await $fetch<T>(path, {
      method: 'POST',
      baseURL,
      body,
    });
  };

  return { get, post };
}
