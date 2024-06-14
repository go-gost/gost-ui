import { Button, ButtonProps } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const LanguageButton = (props: ButtonProps) => {
  const { i18n } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  (window as any).i18n = i18n;
  return (
    <Button
      loading={isLoading}
      shape="circle"
      {...props}
      onClick={() => {
        setLoading(true);
        i18n
          .changeLanguage(i18n.resolvedLanguage === "en" ? "zh-cn" : "en")
          // .then(()=>console.log('changeLanguage ok'), (err) => console.error(err))
          .finally(() => setLoading(false));
      }}
    >
      {isLoading ? "" : i18n.resolvedLanguage === "en" ? "中" : "En"}
    </Button>
  );
};
