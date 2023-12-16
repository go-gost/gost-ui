import { format, parse, applyEdits } from "jsonc-parser";

const localCacheKeys = ['_id_', '_key_', '_type_'];

export const jsonFormat = (json: any) => {
  return JSON.stringify(json, null, 4);
};

export const jsonFormatValue = (json: any) => {
  const newJson = {...json};
  for (const key of localCacheKeys) {
    delete newJson[key];
  }
  return jsonFormat(newJson);
};

export const jsonStringFormat = (str: string) => {
  return applyEdits(
    str,
    format(str, undefined, { tabSize: 4, insertSpaces: true })
  );
};

export const jsonParse = (str: string) => {
  const errs: any[] = [];
  const obj = parse(str, errs, { allowTrailingComma: true });
  if (errs.length) {
    console.log(errs);
    throw errs[0];
  }
  return obj;
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
