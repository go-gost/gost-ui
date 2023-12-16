import { getIdb, updatedIdb } from "./db";
import type * as Gost from "./types";
import { getGost } from "../uitls/server";
import { configEvent } from "../uitls/events";
const localCache = "localCache";
const savedServer = "savedServer";

// cache 放入同一个store中
export class GostCommit<T = any> {
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
      `${this.dsName}|++_id_,_key_,_type_,[_type_+_key_],[name+_type_+_key_]`
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
    if (!obj._id_) {
      const { transaction, store } = await this._getTransaction();
      const old = await store
        .index("[name+_type_+_key_]")
        .get(IDBKeyRange.only([name, this.type, this.key]));
      obj._id_ = old._id_;
      await store.put({ ...old, ...obj, _id_: old._id_ });
      return transaction.done;
    } else {
      const idb = await this._getIdb();
      await idb.put(this.dsName, obj);
    }
  };
  delete = async (name: string) => {
    const { transaction, store } = await this._getTransaction();
    const old = await store
      .index("[name+_type_+_key_]")
      .get(IDBKeyRange.only([name, this.type, this.key]));
    await store.delete(old._id_);
    return transaction.done;
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
  private static _getIdb() {
    return getIdb({ [savedServer]: `addr`, [localCache]: "++_id_,_key_" });
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
  static async getAllCacheConfig(key?: string) {
    const idb = await this._getIdb();
    if (key) {
      return idb.getAllFromIndex(localCache, "_key_", IDBKeyRange.only(key));
    } else {
      return idb.getAll(localCache);
    }
  }
}

export const fixOldCacheConfig = async () => {
  // 旧数据迁移
  const db = await getIdb(`${localCache}|++_id_`);
  const names = db.objectStoreNames;
  const test = /^services-/;
  const _type_ = "services";
  const oldNames = [...names].filter((name) => test.test(name));
  const t = db.transaction(names, "readwrite");
  for (const name of oldNames) {
    const list = await t.objectStore(name).getAll();
    let _key_ = decodeURIComponent(name.replace(/^services-/, ""));
    if (!/^(https?:)?\/\//.test(_key_)) {
      _key_ = `${location.protocol}//` + _key_;
    } else if (/^\/\//.test(_key_)) {
      _key_ = `${location.protocol}` + _key_;
    }
    if (list.length > 0) {
      await list.map((value) =>
        t.objectStore(localCache).add({ ...value, _type_, _key_ })
      );
    }
    await t.objectStore(name).clear();
  }
  await t.done;
  oldNames.length &&
    updatedIdb((t: IDBTransaction) => {
      const names = [...t.objectStoreNames];
      const test = /^services-/;
      const oldNames = names.filter((name) => test.test(name));
      [...oldNames, "services", "localConfigStore"].forEach((name) => {
        if (names.includes(name)) t.db.deleteObjectStore(name);
      });
    });
  return oldNames.length > 0;
};
