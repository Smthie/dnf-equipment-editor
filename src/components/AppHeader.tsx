import { Button, Select, Tooltip } from "antd";
import { FolderOpenOutlined, ReloadOutlined } from "@ant-design/icons";
import { encodingOptions } from "../utils/encoding";
import type { SupportedEncoding } from "../utils/encoding";

export type EncodingLockReason = "loading" | "saving" | "dirty";

const LOCK_REASON_HINT: Record<EncodingLockReason, string> = {
  loading: "正在解析目录，等待完成后再切换编码",
  saving: "正在保存修改，等待写入完成后再切换编码",
  dirty: "存在未保存修改，请先保存或还原再切换编码"
};

interface AppHeaderProps {
  directoryName: string;
  loading: boolean;
  encoding: SupportedEncoding;
  encodingLockReason: EncodingLockReason | null;
  onEncodingChange: (encoding: SupportedEncoding) => void;
  onPickDirectory: () => void;
}

export function AppHeader(props: AppHeaderProps) {
  const hasDirectory = Boolean(props.directoryName);
  const encodingHint = props.encodingLockReason
    ? LOCK_REASON_HINT[props.encodingLockReason]
    : "切换编码后会按新编码重新解析当前目录";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden>
            DNF
          </div>
          <div className="brand-copy">
            <div className="brand-title">Equipment 编辑器</div>
            <div className="brand-subtitle">本地装备文件可视化工作台</div>
          </div>
        </div>
        <div className="header-actions">
          <Tooltip title={encodingHint}>
            <div className="encoding-picker">
              <span className="encoding-picker-label">文件编码</span>
              <Select<SupportedEncoding>
                size="small"
                value={props.encoding}
                disabled={props.encodingLockReason !== null}
                onChange={props.onEncodingChange}
                options={encodingOptions.map((option) => ({ value: option.value, label: option.label }))}
                style={{ minWidth: 200 }}
              />
            </div>
          </Tooltip>
          <div
            className={`directory-pill${hasDirectory ? " is-active" : ""}`}
            title={props.directoryName || "尚未选择目录"}
          >
            <span className="pill-dot" />
            <FolderOpenOutlined />
            <span>{props.directoryName || "尚未选择目录"}</span>
          </div>
          <Button
            type="primary"
            icon={hasDirectory ? <ReloadOutlined /> : <FolderOpenOutlined />}
            loading={props.loading}
            onClick={props.onPickDirectory}
          >
            {hasDirectory ? "重新选择目录" : "选择 equipment 目录"}
          </Button>
        </div>
      </div>
    </header>
  );
}
