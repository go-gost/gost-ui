import axios from "axios";
import { getInfo } from "./server";
import { message } from "antd";
import { configEvent } from "./events";
import { t } from "i18next";

const require = axios.create();
require.interceptors.request.use((config) => {
  const info = getInfo();
  config.baseURL = info?.addr;
  config.auth = info?.auth;
  return config;
});
require.interceptors.response.use(
  (res) => {
    if (res.config.method !== "get" && !(res.config as any)?.noMsg) {
      message.success(t("msg.success"));
    }
    if (res.data) {
      return res.data;
    }
    return res;
  },
  (error) => {
    const { response } = error || {};
    let msg = error.message || t("msg.unknown");
    if (response?.data?.msg) {
      msg = response.data.msg;
    }
    // Polled reads opt out: 5 s failures must not toast on every tick.
    if (!(error?.config as any)?.noMsg) {
      message.error(msg);
    }
    throw error;
  }
);
export default require;
