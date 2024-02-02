import React from "react";
import { Config } from "../api/types";
import { configEvent } from "./events";

type GostCtx = {
  gostConfig?: Partial<Config> | null;
  localConfig?: Partial<Config> | null;
  isLoading?: boolean;
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
  localList?: any[];
  updateLocalList?: () => void;
  comm?: Comm;
}>({ localList: [], name: "" });

export const commBindEvent = (name: string, comm: Comm) => {
  const eventName = `${name}:getComm`;
  const onEvent = (callback: (comm: Comm) => void) => {
    callback(comm);
  };
  configEvent.on(eventName, onEvent);
  return () => {
    configEvent.off(eventName, onEvent);
  };
};

export const getCommByName = (name: string) => {
  return new Promise<Comm>((resolve, reject) => {
    const eventName = `${name}:getComm`;
    configEvent.emit(eventName, resolve);
  });
};
