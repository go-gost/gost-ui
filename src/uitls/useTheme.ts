import { useEffect, useMemo, useState } from "react";
import { useSettings } from "./server";

export const useSysIsDark = () => {
  const [sysIsDark, setSysIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const themeChange = (ev: MediaQueryListEvent) => {
      setSysIsDark(ev.matches);
    };
    matchMedia.addEventListener("change", themeChange);
    return () => {
      matchMedia.removeEventListener("change", themeChange);
    };
  }, []);
  return sysIsDark;
};

export const useIsDark = ()=> {
  const sysIsDark = useSysIsDark();
  const { theme: userTheme } = useSettings();
  const isDark = useMemo(() => {
    // console.log('useIsDark')
    if (!userTheme || userTheme === "system") {
      return sysIsDark;
    } else {
      return userTheme === "dark" ? true : false;
    }
  }, [userTheme, sysIsDark]);
  return isDark;
}
