import {
  AppstoreAddOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Select, Space } from "antd";
import {
  attachTypeOptions,
  equipmentTypeOptions,
  rarityFilterOptions,
} from "../domain/equipmentOptions";
import { EMPTY_FILTER_VALUE } from "../domain/filter";
import type { EquipmentFilters } from "../domain/filter";

interface FilterToolbarProps {
  filters: EquipmentFilters;
  visibleCount: number;
  selectedCount: number;
  dirtyCount: number;
  saving: boolean;
  onFilterChange: (field: keyof EquipmentFilters, value: string) => void;
  onOpenExcludeSelected: () => void;
  onOpenBatch: () => void;
  onRestoreAll: () => void;
  onSaveAll: () => void;
}

interface EquipmentFilterFormProps {
  filters: EquipmentFilters;
  onFilterChange: (field: keyof EquipmentFilters, value: string) => void;
}

const emptyFilterOption = { value: EMPTY_FILTER_VALUE, label: "空值" };

export function FilterToolbar(props: FilterToolbarProps) {
  return (
    <section className="panel filter-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-text">筛选 &amp; 批量</span>
          <span className="panel-title-meta">
            <span className="dot" />
            视图 <strong>{props.visibleCount}</strong>
            <span className="dot" />
            已选 <strong>{props.selectedCount}</strong>
          </span>
        </div>
        <div className="panel-actions">
          <Button
            icon={<MinusCircleOutlined />}
            disabled={!props.selectedCount}
            onClick={props.onOpenExcludeSelected}
          >
            排除选中
          </Button>
          <Button
            type="primary"
            icon={<AppstoreAddOutlined />}
            disabled={!props.selectedCount}
            onClick={props.onOpenBatch}
          >
            批量编辑
          </Button>
          <Space size={8} wrap>
            <Button
              icon={<UndoOutlined />}
              disabled={!props.dirtyCount || props.saving}
              onClick={props.onRestoreAll}
            >
              还原全部
            </Button>
            <Button
              danger
              type="primary"
              icon={<SaveOutlined />}
              disabled={!props.dirtyCount}
              loading={props.saving}
              onClick={props.onSaveAll}
            >
              保存全部 ({props.dirtyCount})
            </Button>
          </Space>
        </div>
      </div>
      <div className="panel-body">
        <EquipmentFilterForm
          filters={props.filters}
          onFilterChange={props.onFilterChange}
        />
      </div>
    </section>
  );
}

export function EquipmentFilterForm(props: EquipmentFilterFormProps) {
  return (
    <Form layout="vertical" className="filter-form">
      <Form.Item label="编号">
        <Input
          allowClear
          placeholder="输入编号"
          value={props.filters.id}
          onChange={(event) => props.onFilterChange("id", event.target.value)}
        />
      </Form.Item>
      <Form.Item label="名称">
        <Input
          allowClear
          placeholder="模糊匹配"
          value={props.filters.name}
          onChange={(event) => props.onFilterChange("name", event.target.value)}
        />
      </Form.Item>
      <Form.Item label="装备等级">
        <Select
          allowClear
          placeholder="全部"
          options={[
            emptyFilterOption,
            ...rarityFilterOptions.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          value={props.filters.rarity || undefined}
          onChange={(value) => props.onFilterChange("rarity", value ?? "")}
        />
      </Form.Item>
      <Form.Item label="装备类型">
        <Select
          allowClear
          placeholder="全部"
          options={[
            emptyFilterOption,
            ...equipmentTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          value={props.filters.equipmentType || undefined}
          onChange={(value) =>
            props.onFilterChange("equipmentType", value ?? "")
          }
        />
      </Form.Item>
      <Form.Item label="交易类型">
        <Select
          allowClear
          placeholder="全部"
          options={[
            emptyFilterOption,
            ...attachTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          value={props.filters.attachType || undefined}
          onChange={(value) => props.onFilterChange("attachType", value ?? "")}
        />
      </Form.Item>
      <Form.Item label="使用等级">
        <Input
          allowClear
          placeholder="数值"
          value={props.filters.minimumLevel}
          onChange={(event) =>
            props.onFilterChange("minimumLevel", event.target.value)
          }
        />
      </Form.Item>
      <Form.Item label="掉落概率">
        <Input
          allowClear
          placeholder="数值"
          value={props.filters.creationRate}
          onChange={(event) =>
            props.onFilterChange("creationRate", event.target.value)
          }
        />
      </Form.Item>
      <Form.Item label="掉落等级">
        <Input
          allowClear
          placeholder="数值"
          value={props.filters.grade}
          onChange={(event) =>
            props.onFilterChange("grade", event.target.value)
          }
        />
      </Form.Item>
    </Form>
  );
}
