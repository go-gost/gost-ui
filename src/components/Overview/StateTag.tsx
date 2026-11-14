import { Tag } from "antd";

const COLORS: Record<string, string | undefined> = {
  ready: "green",
  running: "green",
  failed: "red",
};

const StateTag = ({ state }: { state?: string }) => {
  if (!state) return <>—</>;
  return <Tag color={COLORS[state]}>{state}</Tag>;
};

export default StateTag;
