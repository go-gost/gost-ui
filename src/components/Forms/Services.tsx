import {
  BetaSchemaForm,
  type ProFormColumnsType,
} from "@ant-design/pro-components";
import { ServiceConfig } from "../../api/types";

const columns: ProFormColumnsType<ServiceConfig>[] = [
  {
    dataIndex:'name',
    title: "服务名",
    valueType: 'text',
  },
  {
    dataIndex:'addr',
    title: "地址端口",
    valueType: 'text',
  },
  {
    dataIndex:'addr',
    title: "地址端口",
    valueType: 'text',
  }
];

const ServiceForm: React.FC<any> = (props) => {
  return <BetaSchemaForm<ServiceConfig> columns={columns}></BetaSchemaForm>;
};

export default ServiceForm;
