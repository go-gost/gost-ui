import React from "react";

type GostCtx = {
  gostConfig?: object;
  updateConfig?: () => PromiseLike<object>;
  logout?: () => void;
};
const Ctx = React.createContext<GostCtx>({});
export default Ctx;
