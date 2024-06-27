import qs from "qs";
import { Config, ForwardNodeConfig, NodeConfig } from "../../api/types";
import { useContext, useMemo } from "react";
import Ctx, { CardCtx } from "../../utils/ctx";
import { Space, Tag, Tooltip } from "antd";
import JsonForm from "../Forms/Json";
import { jsonFormatValue, jsonParse } from "../../utils";
import { UpdateCtx } from "../List/Public";
import { useTranslation } from "react-i18next";

export function viewNode(this: Partial<Config>, data: NodeConfig) {
  const {
    name,
    addr,
    connector: { type: connectorType, metadata },
    dialer: { type: dialerType },
  } = data;

  const _metadata = metadata ? qs.stringify(metadata) : "";
  return `${connectorType}${dialerType ? "+" + dialerType : ""}://${addr}${
    _metadata ? "?" + _metadata : ""
  }`;
}

const NodeFormat: React.FC<unknown> = (props) => {
  const { name, addr } = props as { name: string; addr: string };
  const connectorType = (props as NodeConfig).connector?.type;
  const dialerType = (props as NodeConfig).dialer?.type;
  const metadata =
    (props as NodeConfig).connector?.metadata || (props as NodeConfig).metadata;
  const _metadata = metadata ? qs.stringify(metadata) : "";
  return (
    <Space>
      {(connectorType || dialerType) && (
        <Tag color="#87d068">{`${connectorType}${
          dialerType ? "+" + dialerType : ""
        }`}</Tag>
      )}
      <Tag color="green">{addr}</Tag>
      {_metadata && (
        <Tag color="purple" title="_metadata">
          metadata
        </Tag>
      )}
    </Space>
  );
};

export function ViewNode<T extends { name: string; addr: string }>({
  node,
  upjson,
}: {
  node: T;
  upjson?: (newNode: T) => void;
}) {
  const { t } = useTranslation();
  const { name } = node;
  const { update } = useContext(UpdateCtx);

  const tagProps = useMemo(() => {
    if (upjson) {
      return {
        className: "editor-json",
        onDoubleClick: () => {
          JsonForm.show({
            title: t("base.cmd.edit"),
            initialValues: { value: jsonFormatValue(node) },
            onFinish: async (values: any) => {
              upjson(jsonParse(values.value));
              update!();
              return true;
            },
          });
        },
      };
    }
    return {};
  }, [node, t, update, upjson]);

  return (
    <Tooltip color="#ddffbf" title={<NodeFormat {...(node as any)} />}>
      <Tag
        bordered={false}
        color="green"
        title={t("text.doubleClickEdit")}
        {...tagProps}
      >
        {name}
      </Tag>
    </Tooltip>
  );
}
