import React, { useCallback, useEffect, useState } from "react";
import { Col, Flex, Row, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { GostApiConfig, getLocalServers, deleteLocal } from "../utils/server";
import { useTranslation } from "react-i18next";

const LocalServers = () => {
  const { t } = useTranslation();
  const [list, setList] = useState<GostApiConfig[]>();
  // const [local, setLocal] = useState<Record<string, GostApiConfig>>();

  const updateList = useCallback(async () => {
    return getLocalServers()
      .then((local) => {
        return local.sort((a, b) => {
          const t1 = a.time || 0;
          const t2 = b.time || 0;
          return t2 - t1;
        });
      })
      .then((list) => setList(list));
  }, []);
  useEffect(() => {
    updateList();
    // getList().then(list=>setList(list))
  }, []);

  return (
    <>
      {list && list?.length > 0 ? (
        <Space direction="vertical" style={{ display: "flex" }}>
          <div>{t('home.quickConnect')}</div>
          <Row gutter={10}>
            {list.map((item) => {
              return (
                <Col
                  key={item.addr}
                  span={12}
                  title={item.addr}
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Flex gap={5} style={{ overflow: "hidden" }}>
                    <a
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: "auto",
                      }}
                      href={`?use=${item.addr}`}
                    >
                      {item.addr}
                    </a>
                    <DeleteOutlined
                      style={{ color: "red" }}
                      onClick={async () => {
                        await deleteLocal(item.addr);
                        updateList();
                      }}
                    />
                  </Flex>
                </Col>
              );
            })}
          </Row>
        </Space>
      ) : null}
    </>
  );
};

export default LocalServers;
