import React, { useEffect, useMemo, useRef, useState } from "react";
import type * as Monaco from "monaco-editor";
import { Input } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useBindValue } from "../../utils/use";
import { useIsDark } from "../../utils/useTheme";
import "../../utils/useMonacoEdit";

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
  const { t } = useTranslation();
  const [language, setLanguage] = useBindValue(props.language, "javascript");
  const [value, setValue] = useBindValue(props.value, props.defaultValue, "");
  const [isReady, setReady] = useState(false);
  const [editor, setEditor] = useState<Monaco.editor.IStandaloneCodeEditor>();
  const divEl = useRef<HTMLDivElement>(null);
  const refEditor = useRef<Monaco.editor.IStandaloneCodeEditor>(null);
  const self = useRef<any>({});
  const isDark = useIsDark();
  const _theme = useMemo(() => {
    if (theme) return theme;
    return isDark ? "vs-dark" : "vs";
  }, [theme, isDark]);

  React.useImperativeHandle(ref, () => editor!, [editor]);
  React.useImperativeHandle(refEditor, () => editor!, [editor]);

  React.useImperativeHandle(
    self,
    () => {
      return {
        onChange,
        editor,
        options,
      };
    },
    [onChange, editor, options]
  );
  useEffect(() => {
    monacoIsReady.then(() => {
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (isReady) {
      if (divEl.current) {
        const devel = divEl.current;
        const _editor: Monaco.editor.IStandaloneCodeEditor =
          monaco.editor.create(devel, {
            value: value,
            language: language,
            theme: _theme,
            ...defOptions,
            ...options,
          });
        setEditor(_editor);
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
          label: t("msg.wordWrap"),
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
        return () => {
          _editor?.dispose?.();
          // resizeObserver.unobserve(el);
          // resizeObserver.disconnect();
        };
      }
    }
    // let editor: any;
  }, [isReady]);

  useEffect(() => {
    if (self.current?.editor) {
      const editor = self.current.editor;
      if (value != editor.getValue()) {
        if(self.current?.options?.readOnly){
          editor.setValue(value);
        }else{
          // 支持回退
          editor.executeEdits(null, [
            {
              range: editor.getModel()!.getFullModelRange(),
              text: value,
              forceMoveMarkers: false,
            },
          ]);
        }
      }
    }
  }, [value]);

  return isReady ? (
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
  ) : (
    <Input.TextArea
      style={{ height: height || "100%" }}
      className={classnames(className)}
      value={value}
      onChange={(event) => {
        const _value = event.target.value;
        setValue(_value);
        self.current?.onChange?.(_value);
      }}
    ></Input.TextArea>
  );
};

export const CodeEditor = React.forwardRef(CodeEditor_);
