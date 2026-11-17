import * as API from "../api";
import type { Config } from "../api/types";
import type { LinkChange } from "../graph/links";
import { configEvent } from "./events";
import { useServerConfig } from "./server";

/** Persist a link mutation through the resource API, then refresh config. */
export async function applyLinkChange(change: LinkChange): Promise<void> {
  const items = change.config[change.resource] as
    | Array<{ name?: string }>
    | undefined;
  const item = items?.find((entry) => entry.name === change.name);
  if (!item) {
    throw new Error(`${change.resource}/${change.name} not found`);
  }

  const api = API[change.resource] as unknown as {
    put: (id: string, data: unknown) => Promise<unknown>;
  };
  await api.put(change.name, item);

  configEvent.emit("apiUpdate");
  useServerConfig.set((await API.getConfig()) as unknown as Config);
}
