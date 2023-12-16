import idbOpen, { InitOptions } from "idb-open-plus";
import { wrap, openDB } from "idb";

const DB_NAME = "GOST-UI";

export const getIdb = async (store: InitOptions["store"]) =>
  wrap(await idbOpen(DB_NAME, { store }));

// 主动更新本地数据库
export const updatedIdb = async (updateCallback: any) => {
  const db = await idbOpen(DB_NAME);
  const newVersion = db.version + 1;
  db.close();
  openDB(DB_NAME, newVersion, {
    upgrade: (db, oldVersion, newVersion, transaction, event) => {
      updateCallback(transaction);
    },
  });
};
