import { Space, Tag, Tooltip } from "antd";
import { ChainConfig, Config, HopConfig } from "../../api/types";
import { ViewHop, viewHops } from "./hop";
import { RightOutlined } from "@ant-design/icons";
import JsonForm from "../Forms/Json";
import { jsonFormatValue, jsonParse } from "../../utils";
import { useContext } from "react";
import { UpdateCtx } from "../List/Public";
import { useTranslation } from "react-i18next";

export default function viewChain(this: Partial<Config>, chain: ChainConfig) {
  const { hops } = chain;
  return viewHops.call(this, hops);
}

export function ViewHops(props: { hops: HopConfig[]; root: any }) {
  const { update } = useContext(UpdateCtx);
  const { t } = useTranslation();
  return (
    <Space size={5}>
      {props.hops
        .map((hop, i) => {
          const tootip = <ViewHop {...hop} />;
          return (
            <Tooltip
              key={hop.name + i}
              title={tootip}
              color="#c7e7ff"
              arrow={false}
            >
              <Tag
                bordered={false}
                color="blue"
                className="editor-json"
                title={t("text.doubleClickEdit")}
                onDoubleClick={() => {
                  JsonForm.show({
                    title: t('base.cmd.edit'),
                    initialValues: { value: jsonFormatValue(hop) },
                    onFinish: async (values: any) => {
                      props.hops[i] = jsonParse(values.value);
                      update!();
                      return true;
                    },
                  });
                }}
              >
                {hop.name}
              </Tag>
            </Tooltip>
          );
        })
        .reduce((a: any, b, index) => {
          if (a.length > 0)
            a.push(
              <RightOutlined
                key={"_sp_" + index}
                style={{ color: "blue", fontSize: 12 }}
              />
            );
          a.push(b);
          return a;
        }, [])}
    </Space>
  );
}

export function ViewChain( chain: ChainConfig) {
  const { hops } = chain;
  // return viewHops.call(this, hops);
  return <ViewHops hops={hops} root={chain} />;
}
