import {
  format,
  parse,
  applyEdits,
  ModificationOptions,
  JSONPath,
  modify,
  EditResult,
} from "jsonc-parser";

const localCacheKeys = ["_id_", "_key_", "_type_"];
type modify = {
  path: JSONPath | string;
  value: any;
  options?: ModificationOptions;
};

export const jsonFormat = (json: any) => {
  return JSON.stringify(json, null, 4);
};

export const jsonFormatValue = (json: any) => {
  const newJson = { ...json };
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

export const jsonEdit = (str: string, edits: modify[]) => {
  const results:EditResult = [];
  const run = modify.bind(null,str);
  edits.forEach(({path,value,options},index)=>{
    path = Array.isArray(path) ? path : path.split('.');
    results.push(...run(path,value,options || {}))
  })
  return applyEdits(str, results);
};

export const download = (content: BlobPart, filename: string) => {
  const href = URL.createObjectURL(new Blob([content]));
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  link.click();
  URL.revokeObjectURL(href);
};
