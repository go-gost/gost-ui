import React from "react";
import { Config } from "../api/types";

type GostCtx = {
  gostConfig?: Partial<Config>;
  updateConfig?: () => PromiseLike<object>;
  logout?: () => void;
};

export type Comm = {
  updateValue: (id: string, value: any) => Promise<void>;
  deleteValue: (value: any) => Promise<void>;
  addValue: (json: any) => Promise<void>;
  dispatch: (value: any) => Promise<void>;
  enable: (value: any) => Promise<void>;
  updateLocal: (key: string, value: any) => Promise<void>;
  deleteLocal: (value: any) => Promise<void>;
};

const Ctx = React.createContext<GostCtx>({});
export default Ctx;

export const CardCtx = React.createContext<{
  name: string;
  localList: any[];
  updateLocalList?: () => void;
  comm?: Comm;
}>({ localList: [], name: "" });
