import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { analyzer } from "vite-bundle-analyzer";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const config: UserConfig = {
    base: "./",
    plugins: [react()],
  };

  if (mode === "development") {
    return config;
  }

  if (mode === "production" || mode === "analyzer") {
    config.build = {
      rollupOptions: {
        output: {
          // manualChunks 配置
          manualChunks: {
            monaco: ["monaco-editor"],
            antd: ["antd"],
            // 将组件库的代码打包
            "ant-design": ["@ant-design/icons", "@ant-design/pro-components"],
          },
        },
      },
    };
  }

  if (mode === "analyzer") {
    config.plugins.unshift(analyzer() as any);
    config.build.sourcemap="hidden";
  }

  return config;
});
