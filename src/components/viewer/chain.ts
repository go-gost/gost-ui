import { ChainConfig, Config, HopConfig } from "../../api/types";
import { viewHops } from "./hop";

export default function viewChain(this: Partial<Config>, chain: ChainConfig) {
  const { hops } = chain;
  return viewHops.call(this, hops);
}
