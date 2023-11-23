import axios from "axios";
import { getGost } from "./server";
import { message } from "antd";
import { configEvent } from "./events";

const require = axios.create();
require.interceptors.request.use((config) => {
  const gost = getGost();
  config.baseURL = gost?.addr;
  config.auth = gost?.auth;
  return config;
});
require.interceptors.response.use(
  (res) => {
    if (res.config.method !== "get") {
      configEvent.emit("apiUpdate", res.config);
      message.success('操作成功！')
    }
    if (res.data) {
      return res.data;
    }
    return res;
  },
  (error) => {
    const { response } = error || {};
    let msg = error.message || "出现未知错误！";
    if (response?.data?.msg) {
      msg = response?.data?.msg;
    }
    message.error(msg);
    throw error;
  }
);
export default require;
