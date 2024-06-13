import { getByName } from "./default";
import { getPluginTemplate } from "./otherOrigin";
import { Template } from "./type";

const {def, docUrl, _docUrl }= getByName("resolvers");

export default [
  def,
  {
    label: "Plugin",
    json: _docUrl + getPluginTemplate("resolver"),
  },
] as Template[];
