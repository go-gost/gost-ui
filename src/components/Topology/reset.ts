import { clearPositions } from "../../graph/positions";

/** resetLayout clears the stored positions for the given API address. */
export function resetLayout(infoAddr?: string) {
  clearPositions(infoAddr);
}
