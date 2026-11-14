import { Spin } from "antd";

const Overview = () => (
  <div
    data-testid="overview-stub"
    style={{ display: "flex", justifyContent: "center", paddingTop: "15vh" }}
  >
    <Spin size="large" />
  </div>
);

export default Overview;
