/* eslint-disable */
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import MonacoEditor from "react-monaco-editor";
// import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
// import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
// import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
// @ts-ignore
// import { language as yamlLanguage } from "monaco-editor/esm/vs/basic-languages/yaml/yaml";

// eslint-disable-next-line
// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    console.log("[label]", label);
    // setLocaleData(zh_CN.contents);
    if (label === "json") {
      return new jsonWorker();
    }
    // if (label === "css" || label === "scss" || label === "less") {
    //   return new cssWorker();
    // }
    // if (label === "html" || label === "handlebars" || label === "razor") {
    //   return new htmlWorker();
    // }
    // if (label === "typescript" || label === "javascript") {
    //   return new tsWorker();
    // }
    return new editorWorker();
  },
};

var modelUri = monaco.Uri.parse("a://b/foo.json"); // a made up unique URI for our model
var getModel = (value: string) => {
  return monaco.editor.createModel(value, "json", modelUri);
};
var model = getModel('');

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  allowComments: true,
  trailingCommas: "warning",
  validate: true,
  // json 数据格式测试
  schemas: [
    {
      uri: "http://gost/config.json", // id of the first schema
      fileMatch: [modelUri.toString()], // associate with our model
      schema: {
        type: "object",
        properties: {
          p1: {
            enum: ["v1", "v2"],
          },
          p2: {
            $ref: "http://myserver/bar-schema.json", // reference the second schema
          },
        },
      },
    },
    {
      uri: "http://myserver/bar-schema.json", // id of the second schema
      schema: {
        type: "object",
        properties: {
          q1: {
            enum: ["x1", "x2"],
          },
        },
      },
    },
  ],
});
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

export { MonacoEditor, modelUri, getModel, model };
