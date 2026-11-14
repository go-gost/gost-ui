import { Typography, theme } from "antd";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

/** Inline SVG polyline; no chart dependency. */
const Sparkline = ({
  values,
  width = 280,
  height = 48,
  color,
}: SparklineProps) => {
  const { token } = theme.useToken();
  if (values.length < 2) {
    return <Typography.Text type="secondary">—</Typography.Text>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (width * index) / (values.length - 1);
      const y =
        min === max
          ? height / 2
          : height - ((value - min) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color ?? token.colorPrimary}
        strokeWidth={1.5}
      />
    </svg>
  );
};

export default Sparkline;
