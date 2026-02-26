type ExtensionApi = typeof chrome;

const extApi = ((globalThis as { browser?: ExtensionApi }).browser ??
  chrome) as ExtensionApi;

export default extApi;
