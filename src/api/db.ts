import idbOpen, { InitOptions } from "idb-open-plus";
import { wrap } from "idb";

const DB_NAME = "GOST-UI";

export const getIdb = async (store: InitOptions["store"]) =>
  wrap(await idbOpen(DB_NAME, { store }));
