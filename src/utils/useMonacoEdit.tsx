import { getI18n } from "react-i18next";

const langMap: Record<string, string> = {
  zh: "zh-cn",
  en: "",
};

(function () {
  const require = (window as any).require;
  if (require) {
    const i18n = getI18n();
    // DOTO: monaco 动态设置语言未实现
    // i18n.on('languageChanged',(event)=>{
    //   console.log('languageChanged', event)
    // })
    require.config({
      "vs/nls": {
        availableLanguages: {
          "*": langMap[i18n.resolvedLanguage!] ?? "",
        },
      },
    });
  }
  (window as any).monacoIsReady = new Promise((resolve, reject) => {
    if (!require) return reject("Not loaded monaco loader.js");
    require(["vs/editor/editor.main"], function () {
      resolve(monaco);
    });
  });
})();

monacoIsReady.then(() => {
  // monacoPython.register(); //注册 关键字，内置函数 代码提示 ；
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    allowComments: true,
    trailingCommas: "warning",
    validate: true,
  });
  // monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
});
