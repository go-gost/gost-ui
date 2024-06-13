import qs from "qs";
import { Config, NodeConfig } from "../../api/types";
import { useContext, useMemo } from "react";
import Ctx, { CardCtx } from "../../uitls/ctx";
import { Space, Tag, Tooltip } from "antd";
import { showJsonForm } from "../Forms/Json";
import { jsonFormatValue, jsonParse } from "../../uitls";
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

const NodeFormat = (props: NodeConfig) => {
  const {
    name,
    addr,
    connector: { type: connectorType, metadata } = {},
    dialer: { type: dialerType } = {},
  } = props;
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

export const ViewNode = ({
  node,
  upjson,
  isLink = false,
}: {
  node: NodeConfig;
  isLink?: boolean;
  upjson?: (newNode: NodeConfig) => void;
}) => {
  const { t } = useTranslation();
  const { name } = node;
  const { update } = useContext(UpdateCtx);
  return (
    <Tooltip color="#ddffbf" title={<NodeFormat {...node} />}>
      <Tag
        bordered={false}
        color="green"
        className="editor-json"
        title={t("text.doubleClickEdit")}
        onDoubleClick={() => {
          if (!upjson) return;
          showJsonForm({
            title: t('base.cmd.edit'),
            initialValues: { value: jsonFormatValue(node) },
            onFinish: async (values: any) => {
              upjson(jsonParse(values.value));
              update!();
              return true;
            },
          });
        }}
      >
        {name}
      </Tag>
    </Tooltip>
  );
};
