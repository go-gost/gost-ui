import { getByName } from "./default";
import { getOtherAll } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl }= getByName("authers");

export default [
  def,
  ...getOtherAll("auther", docUrl),
] as Template[];
