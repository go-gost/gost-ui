export const jsonFormat = (json: object) => {
  return JSON.stringify(json, null, 4);
};

export const jsonStringFormat = (str: string) => {
  return jsonFormat(JSON.parse(str));
};

export const download = (content: BlobPart, filename: string) => {
  const href = URL.createObjectURL(new Blob([content]));
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};
