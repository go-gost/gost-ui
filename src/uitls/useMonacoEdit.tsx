import React, { useEffect, useMemo, useRef, useState } from "react";
import { useBindValue } from "./use";
import type * as Monaco from "monaco-editor";
import classnames from "classnames";
import { useIsDark } from "./useTheme";

(function () {
  const require = (window as any).require;
  let monacoURL;
  const MONACO_URL = import.meta.env.VITE_MONACO_URL || '/monaco-editor';
  if(/^(http[s]:)?\/\//.test(MONACO_URL)){
    monacoURL = MONACO_URL + '/min/vs'
  }else{
    const baseURL = new URL(import.meta.env.BASE_URL, location.href).href;
    monacoURL = new URL(`${MONACO_URL}/min/vs`, baseURL).href;
  }
  
  // if(import.meta.env.PROD && import.meta.env.VITE_MONACO_URL){
  //   monacoURL = import.meta.env.VITE_MONACO_URL + '/min/vs';
  // }else{
  //   const baseURL = new URL(import.meta.env.BASE_URL, location.href).href;
  //   monacoURL = new URL("./monaco-editor/min/vs", baseURL).href;
  // }
  
  // console.log(`import_meta_env_BASE_URL`, import.meta.env.BASE_URL);
  // console.log("baseURL", baseURL);
  // const monacoURL = `//unpkg.com/monaco-editor@0.47.0/min/vs`
  require.config({ paths: { vs: `${monacoURL}` } });
  require.config({
    "vs/nls": {
      availableLanguages: {
        "*": "zh-cn",
      },
    },
  });
  (window as any).monacoIsReady = new Promise((resolve, reject) => {
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

type CodeEditorProps = {
  className?: string;
  style?: React.CSSProperties;
  language?: string;
  value?: string;
  theme?: string;
  height?: string | number;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options?: Monaco.editor.IStandaloneEditorConstructionOptions;
};

const defOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  automaticLayout: true,
};

const CodeEditor_: React.ForwardRefRenderFunction<
  Monaco.editor.IStandaloneCodeEditor,
  CodeEditorProps
> = (props, ref) => {
  const { onChange, options, height, className, theme, style } = props;
  const [language, setLanguage] = useBindValue(props.language, "javascript");
  const [value, setValue] = useBindValue(props.value, props.defaultValue, "");
  const [isReady, setReady] = useState(false);
  const divEl = useRef<HTMLDivElement>(null);
  const editor = useRef<any>(null);
  const self = useRef<any>({});
  const isDark = useIsDark();
  const _theme = useMemo(()=>{
    if(theme) return theme;
    return isDark ? 'vs-dark' : 'vs'
  },[theme, isDark])

  React.useImperativeHandle(ref, () => {
    return editor.current!;
  });

  React.useImperativeHandle(
    self,
    () => {
      return {
        onChange,
      };
    },
    [onChange]
  );

  useEffect(() => {
    // let editor: any;
    if (divEl.current) {
      const el = divEl.current;
      let _editor: Monaco.editor.IStandaloneCodeEditor;
      monacoIsReady.then(() => {
        _editor = editor.current = monaco.editor.create(el, {
          value: value,
          language: language,
          theme: _theme,
          ...defOptions,
          ...options,
        });
        console.log("editor.current", editor.current.getDomNode());
        _editor.onDidChangeModelContent(function (event: any) {
          const _value = _editor.getValue();
          setValue(_value);
          self.current?.onChange?.(_value);
        });

        _editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyX, (e) => {
          _editor.getAction("my-autoWrap-toggle")?.run();
        });

        _editor.addAction({
          id: "my-autoWrap-toggle",
          label: "切换自动换行",
          keybindings: [
            monaco.KeyMod.Alt | monaco.KeyCode.KeyZ,
            // monaco.KeyMod.chord(
            //   monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
            //   monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM
            // ),
          ],

          // A precondition for this action.
          // precondition: null,

          // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
          // keybindingContext: null,

          // contextMenuGroupId: "navigation",
          // contextMenuOrder: 1.5,

          // Method that will be executed when the action is triggered.
          // @param editor The editor instance is passed in as a convenience
          run: function (ed, arg) {
            // alert("i'm running => " + ed.getPosition());
            // console.log("my-autoWrap-toggle", arg);
            const workWrap = ed.getOption(monaco.editor.EditorOption.wordWrap);
            ed.updateOptions({
              wordWrap: workWrap === "on" ? "off" : "on",
            });
          },
        });

        setReady(true);
      });
      // let xc: any;
      // const resizeObserver = new ResizeObserver((entries) => {
      //   // _editor?.layout();
      //   // console.log("resizeObserver");
      //   if (xc) clearTimeout(xc);
      //   xc = setTimeout(() => {
      //     _editor?.layout();
      //   }, 100);
      // });
      // resizeObserver.observe(el);
      return () => {
        _editor?.dispose?.();
        // resizeObserver.unobserve(el);
        // resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (editor.current) {
      if (value != editor.current.getValue()) {
        editor.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <div
      className={classnames(className)}
      style={{
        height: height || "100%",
        minHeight: 0,
        minWidth: 0,
        boxSizing: "border-box",
        ...style,
      }}
      ref={divEl}
    ></div>
  );
};

export const CodeEditor = React.forwardRef(CodeEditor_);
