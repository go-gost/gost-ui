import { getIdb } from "./db";
import type * as Gost from "./types";
import { getGost } from "../uitls/server";

export class GostCommit<T = any> {
  private storeName: string;
  constructor(storeName: string) {
    this.storeName = storeName;
  }
  private get key() {
    return getGost()?.addr;
  }
  private _getIdb = () => {
    return getIdb(`${this.storeName}|++id,_key_,[name+_key_]`);
  };
  getList = async () => {
    const idb = await this._getIdb();
    return idb.getAllFromIndex(this.storeName,'_key_',this.key);
  };
  get = async (name: string) => {
    const idb = await this._getIdb();
    // return idb.get(this.name);
    return idb.getFromIndex(
      this.storeName,
      "[name+_key_]",
      IDBKeyRange.only([name, this.key])
    );
  };
  add = async (obj: any) => {
    const idb = await this._getIdb();
    return idb.add(this.storeName, { ...obj, _key_: this.key });
  };
  put = async (name: string, obj: any) => {
    const idb = await this._getIdb();
    const t = idb.transaction(this.storeName, "readwrite");
    const os = t.objectStore(this.storeName);
    const old = await os.index('[name+_key_]').get(IDBKeyRange.only([name, this.key]));
    await os.put(obj, old.id);
    return t.done;
  };
  delete = async (name: string) => {
    const idb = await this._getIdb();
    const t = idb.transaction(this.storeName, "readwrite");
    const os = t.objectStore(this.storeName);
    const old = await os.index('[name+_key_]').get(IDBKeyRange.only([name, this.key]));
    await os.delete(old.id);
    return t.done
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
