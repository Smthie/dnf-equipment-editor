import { Button, Empty, Space, Table, Tag, Tooltip } from "antd";
import type { TableProps } from "antd";
import { EditOutlined, SaveOutlined, UndoOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { Key } from "react";
import {
  attachLabelByKey,
  attachToneByKey,
  getRarityLabel,
  normalizeAttachType,
  normalizeEquipmentType,
} from "../domain/equipmentOptions";
import { normalizeLineValue } from "../domain/equipmentFile";
import { isRowDirty } from "../domain/equipmentRow";
import type { EquipmentRow } from "../domain/equipmentRow";
import type { EquipmentFields } from "../domain/equipmentFile";
import { compareTextNumbers } from "../utils/sort";

function rowField(row: EquipmentRow, key: keyof EquipmentFields): string {
  return row.kind === "ok" ? row.fields[key] : "";
}

function rowRarity(row: EquipmentRow): string {
  return row.kind === "ok" ? row.fields.rarity : "";
}

interface EquipmentTableProps {
  rows: EquipmentRow[];
  allRowsCount: number;
  loading: boolean;
  selectedRowKeys: Key[];
  savingKeys: Set<string>;
  onSelectionChange: (keys: Key[]) => void;
  onEdit: (row: EquipmentRow) => void;
  onSave: (row: EquipmentRow) => void;
  onRestore: (row: EquipmentRow) => void;
}

export function createEquipmentDetailColumns() {
  const columns: TableProps<EquipmentRow>["columns"] = [
    {
      title: "编号",
      dataIndex: "id",
      width: 116,
      sorter: (a, b) => compareTextNumbers(a.id, b.id),
    },
    {
      title: "名称",
      ellipsis: true,
      width: 280,
      render: (_, row) => {
        if (row.kind === "error") {
          return (
            <Tooltip title={row.readError}>
              <span className="table-error-text">读取失败</span>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={row.fields.name}>
            <span className="equipment-name">{row.fields.name || "—"}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "装备品级",
      width: 116,
      sorter: (a, b) => compareTextNumbers(rowRarity(a), rowRarity(b)),
      render: (_, row) =>
        row.kind === "ok" ? renderRarityTag(row.fields.rarity) : "—",
    },
    {
      title: "装备类型",
      width: 130,
      render: (_, row) =>
        row.kind === "ok"
          ? normalizeEquipmentType(row.fields.equipmentType) || "—"
          : "—",
    },
    {
      title: "交易类型",
      width: 140,
      render: (_, row) =>
        row.kind === "ok" ? renderAttachTag(row.fields.attachType) : "—",
    },
    {
      title: "装备等级",
      width: 92,
      sorter: (a, b) =>
        compareTextNumbers(rowField(a, "minimumLevel"), rowField(b, "minimumLevel")),
      render: (_, row) => (
        <span className="equipment-id">
          {rowField(row, "minimumLevel") || "—"}
        </span>
      ),
    },
    {
      title: "掉落概率",
      width: 108,
      sorter: (a, b) =>
        compareTextNumbers(rowField(a, "creationRate"), rowField(b, "creationRate")),
      render: (_, row) => (
        <span className="equipment-id">
          {rowField(row, "creationRate") || "—"}
        </span>
      ),
    },
    {
      title: "掉落等级",
      width: 100,
      sorter: (a, b) => compareTextNumbers(rowField(a, "grade"), rowField(b, "grade")),
      render: (_, row) => (
        <span className="equipment-id">{rowField(row, "grade") || "—"}</span>
      ),
    },
  ];

  return columns;
}

export function EquipmentTable(props: EquipmentTableProps) {
  const tablePanelRef = useRef<HTMLElement | null>(null);
  const [tableScrollY, setTableScrollY] = useState(360);

  useEffect(() => {
    const panel = tablePanelRef.current;
    if (!panel) return;

    const measure = () => {
      const header = panel.querySelector<HTMLElement>(".panel-header");
      const tableHeader = panel.querySelector<HTMLElement>(".ant-table-header");
      const panelHeight = panel.getBoundingClientRect().height;
      const reservedHeight =
        (header?.offsetHeight || 0) + (tableHeader?.offsetHeight || 48);
      setTableScrollY(
        Math.max(240, Math.floor(panelHeight - reservedHeight - 2)),
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const columns: TableProps<EquipmentRow>["columns"] = [
    ...createEquipmentDetailColumns(),
    {
      title: "操作",
      fixed: "right",
      width: 132,
      align: "center",
      render: (_, row) => {
        const editable = row.kind === "ok";
        const dirty = isRowDirty(row);
        const saving = props.savingKeys.has(row.key);
        return (
          <Space size={4}>
            <Tooltip title="编辑">
              <Button
                icon={<EditOutlined />}
                color="default"
                variant="filled"
                disabled={!editable}
                onClick={() => props.onEdit(row)}
              />
            </Tooltip>
            <Tooltip title="保存当前行">
              <Button
                icon={<SaveOutlined />}
                color="default"
                variant="filled"
                disabled={!dirty}
                loading={saving}
                onClick={() => props.onSave(row)}
              />
            </Tooltip>
            <Tooltip title="还原">
              <Button
                color="default"
                variant="filled"
                icon={<UndoOutlined />}
                disabled={!dirty || saving}
                onClick={() => props.onRestore(row)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const emptyDescription = props.allRowsCount
    ? "没有匹配筛选条件的数据"
    : "选择本地 equipment 文件夹后开始解析";

  return (
    <section className="panel table-panel" ref={tablePanelRef}>
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-text">装备明细</span>
          <span className="panel-title-meta">
            <span className="dot" />共 <strong>{props.rows.length}</strong> 行
          </span>
        </div>
      </div>
      <Table
        rowKey="key"
        loading={props.loading}
        columns={columns}
        dataSource={props.rows}
        pagination={false}
        virtual
        rowClassName={(row) => (isRowDirty(row) ? "dirty-row" : "")}
        rowSelection={{
          columnWidth: 42,
          selectedRowKeys: props.selectedRowKeys,
          preserveSelectedRowKeys: true,
          getCheckboxProps: (row) => ({ disabled: row.kind !== "ok" }),
          onChange: props.onSelectionChange,
        }}
        scroll={{ x: "max-content", y: tableScrollY }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={emptyDescription}
            />
          ),
        }}
      />
    </section>
  );
}

function renderRarityTag(rarity: string) {
  const label = getRarityLabel(rarity);
  if (!label) return "—";
  const tier = String(rarity).trim();
  const toneClass = /^[0-7]$/.test(tier)
    ? `table-tag-rarity-${tier}`
    : "table-tag-rarity-0";
  return <Tag className={`table-tag ${toneClass}`}>{label}</Tag>;
}

function renderAttachTag(value: string) {
  const raw = normalizeLineValue(value);
  if (!raw) return "—";
  const key = raw.toLowerCase().replace(/\s+/g, " ");
  const tone = attachToneByKey[key] || "default";
  const label = attachLabelByKey[key] || normalizeAttachType(value);
  return <Tag className={`table-tag table-tag-attach-${tone}`}>{label}</Tag>;
}
