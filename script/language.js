import fs from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import url from "url";
import { parse } from "csv-parse";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const importFile = path.join(__dirname, "../src/i18n/languages.csv");
const exportDir = path.join(__dirname, "../src/i18n");

let languages;
const langMap = new Map();
const init = (arr) => {
  const [_key, ...langs] = arr;
  languages = langs.map((langName) => {
    const lang = {};
    langMap.set(langName, lang);
    return lang;
  });
};
const output = () => {
  // 保存为json文件
  const langList = [];
  const arr = [];
  langMap.forEach((json, lang) => {
    langList.push({ lang, label: json.language });
    arr.push(
      writeFile(
        path.join(exportDir, `${lang}.json`),
        JSON.stringify(json, undefined, 4)
      )
    );
  });
  arr.push(
    writeFile(
      path.join(exportDir, `languages.json`),
      JSON.stringify(langList, undefined, 4)
    )
  );
  Promise.all(arr).then(() => console.log("done"));
};

const setValue = (obj, key, value) => {
  if (!obj || !key) return;
  const keys = key.split(".");
  let _obj = obj;
  while (keys.length > 1) {
    const _key = keys.shift();
    if (_obj[_key] === undefined) {
      _obj = _obj[_key] = {};
    } else if (typeof _obj[_key] === "object") {
      _obj = _obj[_key];
    } else {
      console.error(`Key [${key}] error!`);
    }
  }
  const _key = keys[0];
  if (_obj[_key] !== undefined) {
    console.error(`Key [${key}] repeat!`);
  }
  _obj[_key] = value || "";
};

function main(){
  const csvp = parse();
  csvp.on("end", output);
  csvp.on("data", function (chunk) {
    // 解析language.csv
    if (!languages) return init(chunk); // 第一行为表头
    const [key, ...values] = chunk;
    values.forEach((value, index) => {
      setValue(languages[index], key, value);
    });
  });
  fs.createReadStream(importFile).pipe(csvp);
}

main();