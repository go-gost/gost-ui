function getJson(storage: Storage, key: string, defaultValue: any = null) {
  const json = storage.getItem(key);
  if(json == null) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(error);
    return defaultValue;
  }
}

function setJson(storage: Storage, key: string, value: any) {
  if (value == null) {
    return storage.removeItem(key);
  }
  storage.setItem(key, JSON.stringify(value));
}
export const getJsonAtSessionStorage = getJson.bind(null, sessionStorage);
export const setJsonAtSessionStorage = setJson.bind(null, sessionStorage);
export const getJsonAtLocalStorage = getJson.bind(null, localStorage);
export const setJsonAtLocalStorage = setJson.bind(null, localStorage);
