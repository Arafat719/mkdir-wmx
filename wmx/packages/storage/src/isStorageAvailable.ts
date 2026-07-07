export function isStorageAvailable(area: "local" | "session"): boolean {
  try {
    const storage = area === "local" ? window.localStorage : window.sessionStorage;
    const testKey = "__wmx_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
