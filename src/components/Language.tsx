import { Button, ButtonProps } from "antd";
import { useTranslation } from "react-i18next";

export const LanguageButton = (props: ButtonProps) => {
  const { i18n } = useTranslation();
  return (
    <Button
      shape="circle"
      {...props}
      onClick={() => {
        i18n.changeLanguage(i18n.resolvedLanguage === "en" ? "zh" : "en");
      }}
    >
      {i18n.resolvedLanguage === "en" ? "中" : "En"}
    </Button>
  );
};
