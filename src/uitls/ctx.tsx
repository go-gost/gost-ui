import React from "react";
import { Config } from "../api/types";

type GostCtx = {
  gostConfig?: Partial<Config>;
  updateConfig?: () => PromiseLike<object>;
  logout?: () => void;
};
const Ctx = React.createContext<GostCtx>({});
export default Ctx;

export const CardCtx = React.createContext<{
  localList: any[];
  updateLocalList?: () => void;
}>({localList:[]});
