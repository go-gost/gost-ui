import { FC } from "react";
import PublicList, { PublicListProps } from "./Public";
import ServiceList from "./service";

const listMap: Record<string, FC<PublicListProps>> = {
  service: ServiceList,
};
export default function getList(module: string) {
  const List = listMap[module] || PublicList;
  return List;
}
