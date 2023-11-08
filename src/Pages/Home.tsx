import React from "react";
import { BetaSchemaForm } from "@ant-design/pro-components";
import type {
  ProFormColumnsType,
  ProFormLayoutType,
} from "@ant-design/pro-components";

type DataItem = { name: string; state: string };
const columns: ProFormColumnsType<DataItem>[] = [
  {
    title: "gost API 地址",
    dataIndex: "addr",
    valueType: "text",
  },
  {
    title: "usrname",
    dataIndex: "addr",
    valueType: "text",
  },
  {
    title: "password",
    dataIndex: "addr",
    valueType: "password",
  },
];

const Home: React.FC = () => {
  return (
    <div>
      <BetaSchemaForm<DataItem>
        layoutType="Form"
        columns={columns}
      ></BetaSchemaForm>
    </div>
  );
};

export default Home;
