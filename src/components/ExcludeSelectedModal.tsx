import { Empty, Modal, Table } from "antd";
import { useMemo, useState } from "react";
import type { EquipmentRow } from "../domain/equipmentRow";
import {
  filterEquipmentRows,
  hasActiveEquipmentFilters,
  initialFilters,
} from "../domain/filter";
import type { EquipmentFilters } from "../domain/filter";
import { createEquipmentDetailColumns } from "./EquipmentTable";
import { EquipmentFilterForm } from "./FilterToolbar";

const previewTableScrollX = 1082;

interface ExcludeSelectedModalProps {
  open: boolean;
  selectedRows: EquipmentRow[];
  onCancel: () => void;
  onConfirm: (excludedRowKeys: string[]) => void;
}

export function ExcludeSelectedModal(props: ExcludeSelectedModalProps) {
  const [excludeFilters, setExcludeFilters] =
    useState<EquipmentFilters>(initialFilters);

  const hasExcludeConditions = useMemo(
    () => hasActiveEquipmentFilters(excludeFilters),
    [excludeFilters],
  );

  const previewRows = useMemo(
    () =>
      hasExcludeConditions
        ? filterEquipmentRows(props.selectedRows, excludeFilters)
        : [],
    [excludeFilters, hasExcludeConditions, props.selectedRows],
  );

  function updateExcludeFilter(field: keyof EquipmentFilters, value: string) {
    setExcludeFilters((current) => ({ ...current, [field]: value }));
  }

  function close() {
    setExcludeFilters(initialFilters);
    props.onCancel();
  }

  function confirm() {
    props.onConfirm(previewRows.map((row) => row.key));
  }

  return (
    <Modal
      title="排除选中"
      width={1120}
      className="equipment-modal exclude-selected-modal"
      centered
      open={props.open}
      okText={`排除 ${previewRows.length} 行`}
      cancelText="取消"
      okButtonProps={{ disabled: !previewRows.length }}
      onCancel={close}
      onOk={confirm}
      afterClose={() => setExcludeFilters(initialFilters)}
    >
      <div className="exclude-modal-body">
        <div className="modal-context">
          <div className="modal-context-title">
            排除项预览 {previewRows.length} / {props.selectedRows.length} 行
          </div>
          <div className="modal-context-path">
            符合排除条件的行会从当前多选中移除，文件内容不会被修改。
          </div>
        </div>
        <section className="exclude-filter-section">
          <div className="exclude-section-title">排除条件</div>
          <EquipmentFilterForm
            filters={excludeFilters}
            onFilterChange={updateExcludeFilter}
          />
        </section>
        <section className="exclude-preview-section">
          <div className="exclude-section-title">排除项预览</div>
          <Table
            rowKey="key"
            size="small"
            virtual
            columns={createEquipmentDetailColumns()}
            dataSource={previewRows}
            pagination={false}
            scroll={{ x: previewTableScrollX, y: 320 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    hasExcludeConditions
                      ? "没有匹配排除条件的数据"
                      : "设置排除条件后显示预览"
                  }
                />
              ),
            }}
          />
        </section>
      </div>
    </Modal>
  );
}
