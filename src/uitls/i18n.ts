import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { isValidElement } from "react";
import en from '../i18n/en.json';
import zh from '../i18n/en.json';
// const en = await import("../i18n/en.json");
// const zh = await import("../i18n/zh.json");
const fallbackLng = "en";
i18n
  // 检测用户当前使用的语言
  // 文档: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // 注入 react-i18next 实例
  .use(initReactI18next)
  // 初始化 i18next
  // 配置参数的文档: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: fallbackLng,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
  });

export function getLabel(label: string | { [key: string]: string }) {
  if (typeof label === "string") return label;
  if (isValidElement(label)) return label;
  const lang = i18n.resolvedLanguage!;
  return label[lang] || label[fallbackLng] || "<unknown>";
}
export default i18n;
