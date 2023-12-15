import { getIdb } from "./db";
import type * as Gost from "./types";
import { getGost } from "../uitls/server";
import { configEvent } from "../uitls/events";
const localCache = "localCache";
const savedServer = "savedServer";

// TODO: cache 放入不同一个store中
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
    return idb.getAllFromIndex(this.storeName, "_key_", this.key);
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
    const old = await os
      .index("[name+_key_]")
      .get(IDBKeyRange.only([name, this.key]));
    await os.put(obj, old.id);
    return t.done;
  };
  delete = async (name: string) => {
    const idb = await this._getIdb();
    const t = idb.transaction(this.storeName, "readwrite");
    const os = t.objectStore(this.storeName);
    const old = await os
      .index("[name+_key_]")
      .get(IDBKeyRange.only([name, this.key]));
    await os.delete(old.id);
    return t.done;
  };
}

// cache 放入同一个store中
export class GostCommit1<T = any> {
  private dsName = localCache;
  private type: string;
  constructor(type: string) {
    this.type = type;
  }
  private get key() {
    return getGost()?.addr;
  }
  private _getIdb = () => {
    return getIdb(
      `${this.dsName}|++id,_key_,_type_,[_type_+_key_],[name+_type_+_key_]`
    );
  };
  private _getTransaction = async () => {
    const idb = await this._getIdb();
    const transaction = idb.transaction(this.dsName, "readwrite");
    const store = transaction.objectStore(this.dsName);
    return {
      transaction,
      store,
    };
  };
  getList = async () => {
    const idb = await this._getIdb();
    return idb.getAllFromIndex(
      this.dsName,
      "[_type_+_key_]",
      IDBKeyRange.only([this.type, this.key])
    );
  };
  get = async (name: string) => {
    const idb = await this._getIdb();
    // return idb.get(this.name);
    return idb.getFromIndex(
      this.dsName,
      "[name+_type_+_key_]",
      IDBKeyRange.only([name, this.type, this.key])
    );
  };
  add = async (obj: any) => {
    const idb = await this._getIdb();
    await idb.add(this.dsName, {
      ...obj,
      _key_: this.key,
      _type_: this.type,
    });
  };
  put = async (name: string, obj: any) => {
    const { transaction, store } = await this._getTransaction();
    const old = await store
      .index("[name+_type_+_key_]")
      .get(IDBKeyRange.only([name, this.type, this.key]));
    await store.put(obj, old.id);
    return transaction.done;
  };
  delete = async (name: string) => {
    const { transaction, store } = await this._getTransaction();
    const old = await store
      .index("[name+_type_+_key_]")
      .get(IDBKeyRange.only([name, this.type, this.key]));
    await store.delete(old.id);
    return transaction.done;
  };
}

export const admissions = new GostCommit1<Gost.AdmissionConfig>("admissions");
export const authers = new GostCommit1<Gost.AdmissionConfig>("authers");
export const bypasses = new GostCommit1<Gost.BypassConfig>("bypasses");
export const chains = new GostCommit1<Gost.ChainConfig>("chains");
export const climiters = new GostCommit1<Gost.LimiterConfig>("climiters");
export const limiters = new GostCommit1<Gost.LimiterConfig>("limiters");
export const rlimiters = new GostCommit1<Gost.LimiterConfig>("rlimiters");
export const hops = new GostCommit1<Gost.HopConfig>("hops");
export const hosts = new GostCommit1<Gost.HostsConfig>("hosts");
export const ingresses = new GostCommit1<Gost.IngressConfig>("ingresses");
export const resolvers = new GostCommit1<Gost.ResolverConfig>("resolvers");
export const services = new GostCommit1<Gost.ServiceConfig>("services");

export class ServerComm {
  private static _getIdb() {
    return getIdb({ [savedServer]: `addr`, [localCache]: "++id,_key_" });
  }
  static async getAllServer() {
    const idb = await this._getIdb();
    return idb.getAll(savedServer);
  }
  static async getServer(key: string) {
    const idb = await this._getIdb();
    return idb.get(savedServer, key);
  }
  static async setServer(value: any) {
    const idb = await this._getIdb();
    await idb.put(savedServer, value);
  }
  static async deleteServer(key: string, rmCache: boolean = false) {
    const idb = await this._getIdb();
    await idb.delete(savedServer, key);
    if (rmCache) {
      await this.deleteCacheConfig(key);
    }
  }
  static async deleteCacheConfig(key: string) {
    const idb = await this._getIdb();
    const t = idb.transaction([localCache], "readwrite");
    const sCache = await t.objectStore(localCache);
    const keys = await sCache.index("_key_").getAllKeys(IDBKeyRange.only(key));
    await sCache.delete(keys);
  }
  static async getAllCacheConfig(key?: string){
    const idb = await this._getIdb();
    if(key){
      return idb.getAllFromIndex(localCache, "_key_", IDBKeyRange.only(key));
    }else{
      return idb.getAll(localCache);
    }
  }
}
