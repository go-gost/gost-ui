import { getIdb } from "./db";
import type * as Gost from "./types";
import { getGost } from "../uitls/server";

export class GostCommit<T = any> {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }
  private _getStoreName = () => {
    const { addr } = getGost() || {};
    if (!addr) throw "no Server";
    return `${this.name}-${encodeURIComponent(addr)}`;
  };
  private _getIdb = () => {
    return getIdb(`${this._getStoreName()}|name`);
  };
  getList = async () => {
    const idb = await this._getIdb();
    return idb.getAll(this._getStoreName());
  };
  get = async (key: string) => {
    const idb = await this._getIdb();
    return idb.get(this._getStoreName(), key);
  };
  add = async (obj: any) => {
    const idb = await this._getIdb();
    return idb.add(this._getStoreName(), obj);
  };
  put = async (key: string, obj: any) => {
    const idb = await this._getIdb();
    return idb.put(this._getStoreName(), obj);
  };
  delete = async (key: string) => {
    const idb = await this._getIdb();
    return idb.delete(this._getStoreName(), key);
  };
}

export const admissions = new GostCommit<Gost.AdmissionConfig>("admissions");
export const authers = new GostCommit<Gost.AdmissionConfig>("authers");
export const bypasses = new GostCommit<Gost.BypassConfig>("bypasses");
export const chains = new GostCommit<Gost.ChainConfig>("chains");
export const climiters = new GostCommit<Gost.LimiterConfig>("climiters");
export const limiters = new GostCommit<Gost.LimiterConfig>("limiters");
export const rlimiters = new GostCommit<Gost.LimiterConfig>("rlimiters");
export const hops = new GostCommit<Gost.HopConfig>("hops");
export const hosts = new GostCommit<Gost.HostsConfig>("hosts");
export const ingresses = new GostCommit<Gost.IngressConfig>("ingresses");
export const resolvers = new GostCommit<Gost.ResolverConfig>("resolvers");
export const services = new GostCommit<Gost.ServiceConfig>("services");

export class ServerComm {
  private static _storeName = "savedServer";
  private static _getIdb() {
    return getIdb(`${this._storeName}|addr`);
  }
  static async getAll() {
    const idb = await this._getIdb();
    return idb.getAll(this._storeName);
  }
  static async get(key: string) {
    const idb = await this._getIdb();
    return idb.get(this._storeName, key);
  }
  static async set(value: any) {
    const idb = await this._getIdb();
    return idb.put(this._storeName, value);
  }
  static async delete(key: string) {
    const idb = await this._getIdb();
    return idb.delete(this._storeName, key);
  }
}

