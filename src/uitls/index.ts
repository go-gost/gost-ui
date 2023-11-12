export const jsonFormat = (json: object) => {
  return JSON.stringify(json, null, 4);
};
export const jsonStringFormat = (str: string) => {
  return jsonFormat(JSON.parse(str));
};
