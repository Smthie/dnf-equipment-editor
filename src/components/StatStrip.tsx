import type { ReactNode } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined
} from "@ant-design/icons";

interface StatStripProps {
  status: string;
  stats: {
    total: number;
    ok: number;
    failed: number;
    dirty: number;
  };
}

export function StatStrip(props: StatStripProps) {
  return (
    <section className="stat-strip" aria-label="解析概览">
      <div className="stat-cell stat-cell--status">
        <span className="stat-label">状态</span>
        <span className="stat-status-text">{props.status}</span>
      </div>
      <StatMetric tone="neutral" label="总记录" value={props.stats.total} icon={<FileTextOutlined />} />
      <StatMetric tone="ok" label="成功" value={props.stats.ok} icon={<CheckCircleOutlined />} />
      <StatMetric tone="failed" label="失败" value={props.stats.failed} icon={<CloseCircleOutlined />} />
      <StatMetric tone="dirty" label="已编辑" value={props.stats.dirty} icon={<EditOutlined />} />
    </section>
  );
}

function StatMetric({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "neutral" | "ok" | "failed" | "dirty";
}) {
  const isZero = value === 0;
  return (
    <div
      className={`stat-cell stat-cell--metric stat-cell--${tone}${isZero ? " is-zero" : ""}`}
    >
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value.toLocaleString()}</div>
      </div>
    </div>
  );
}
