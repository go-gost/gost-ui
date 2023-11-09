import React from "react";
import {
  BetaSchemaForm,
  ProForm,
  ProFormTextArea,
  type ProFormColumnsType,
  ModalForm,
} from "@ant-design/pro-components";
import { FormSchema } from "@ant-design/pro-form/es/components/SchemaForm/typing";

type Data = { value: string };

const columns: ProFormColumnsType<Data>[] = [
  {
    // width: 'xs',
    dataIndex: "value",
    title: "config",
    valueType: "textarea",
    initialValue: "112233",
  },
  {
    // width: 'xs',
    dataIndex: "value1",
    title: "config",
    valueType: "textarea",
    initialValue: "112233",
  },
  //   {
  //     width: 'xs',
  //     title: '标题',
  //     dataIndex: 'groupTitle',
  //     tip: '标题过长会自动收缩',
  //     formItemProps: {
  //       rules: [
  //         {
  //           required: true,
  //           message: '此项为必填项',
  //         },
  //       ],
  //     },
  //   },
];

type Props = Omit<FormSchema, "columns">;
const JsonForm: React.FC<any> = (props) => {
  return (
    // <BetaSchemaForm<Data, "text">
    //   {...(props as any)}
    //   columns={columns}
    // ></BetaSchemaForm>
    <ModalForm {...props}>
        <ProFormTextArea fieldProps={{rows: 16}} name="value" label="JSON"></ProFormTextArea>
    </ModalForm>
  );
};

export default JsonForm;
