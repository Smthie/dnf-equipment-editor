import { Checkbox, Input, Modal, Select } from "antd";
import { useState } from "react";
import {
  attachTypeOptions,
  equipmentTypeOptions,
  rarityOptions,
} from "../domain/equipmentOptions";
import type { BatchEditableField } from "../domain/equipmentFile";
import { initialBatchFields } from "../domain/batchEdit";
import type { BatchFieldState } from "../domain/batchEdit";

interface BatchEditModalProps {
  open: boolean;
  selectedCount: number;
  onCancel: () => void;
  onConfirm: (fields: BatchFieldState) => void;
}

export function BatchEditModal(props: BatchEditModalProps) {
  const [batchFields, setBatchFields] =
    useState<BatchFieldState>(initialBatchFields);

  function close() {
    setBatchFields(initialBatchFields);
    props.onCancel();
  }

  function confirm() {
    // 是否真正覆盖字段由 enabled 决定，空字符串也是合法的批量写入值。
    props.onConfirm(batchFields);
  }

  function updateBatchField(
    field: BatchEditableField,
    patch: Partial<{ enabled: boolean; value: string }>,
  ) {
    setBatchFields((current) => ({
      ...current,
      [field]: { ...current[field], ...patch },
    }));
  }

  return (
    <Modal
      title="批量编辑"
      width={720}
      className="equipment-modal"
      centered
      open={props.open}
      okText="确认"
      cancelText="取消"
      onCancel={close}
      onOk={confirm}
      afterClose={() => setBatchFields(initialBatchFields)}
    >
      <div className="batch-modal-body">
        <div className="modal-context">
          <div className="modal-context-title">
            将修改应用到 {props.selectedCount} 行已勾选装备
          </div>
          <div className="modal-context-path">
            勾选字段后填写新值，未勾选字段保持原样；批量编辑不支持名称字段。
          </div>
        </div>
        <div className="batch-grid">
          <BatchSelectField
            label="装备等级"
            checked={batchFields.rarity.enabled}
            value={batchFields.rarity.value}
            options={rarityOptions}
            onCheckedChange={(enabled) =>
              updateBatchField("rarity", { enabled })
            }
            onValueChange={(value) => updateBatchField("rarity", { value })}
          />
          <BatchSelectField
            label="装备类型"
            checked={batchFields.equipmentType.enabled}
            value={batchFields.equipmentType.value}
            options={equipmentTypeOptions}
            onCheckedChange={(enabled) =>
              updateBatchField("equipmentType", { enabled })
            }
            onValueChange={(value) =>
              updateBatchField("equipmentType", { value })
            }
          />
          <BatchSelectField
            label="交易类型"
            checked={batchFields.attachType.enabled}
            value={batchFields.attachType.value}
            options={attachTypeOptions}
            onCheckedChange={(enabled) =>
              updateBatchField("attachType", { enabled })
            }
            onValueChange={(value) => updateBatchField("attachType", { value })}
          />
          <BatchInputField
            label="使用等级"
            checked={batchFields.minimumLevel.enabled}
            value={batchFields.minimumLevel.value}
            placeholder="minimum level"
            onCheckedChange={(enabled) =>
              updateBatchField("minimumLevel", { enabled })
            }
            onValueChange={(value) =>
              updateBatchField("minimumLevel", { value })
            }
          />
          <BatchInputField
            label="掉落概率"
            checked={batchFields.creationRate.enabled}
            value={batchFields.creationRate.value}
            placeholder="creation rate"
            onCheckedChange={(enabled) =>
              updateBatchField("creationRate", { enabled })
            }
            onValueChange={(value) =>
              updateBatchField("creationRate", { value })
            }
          />
          <BatchInputField
            label="掉落等级"
            checked={batchFields.grade.enabled}
            value={batchFields.grade.value}
            placeholder="grade"
            onCheckedChange={(enabled) =>
              updateBatchField("grade", { enabled })
            }
            onValueChange={(value) => updateBatchField("grade", { value })}
          />
        </div>
      </div>
    </Modal>
  );
}

function BatchInputField(props: {
  label: string;
  checked: boolean;
  value: string;
  placeholder: string;
  onCheckedChange: (checked: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <div
      className={`batch-field${props.checked ? "" : " batch-field--inactive"}`}
    >
      <Checkbox
        checked={props.checked}
        onChange={(event) => props.onCheckedChange(event.target.checked)}
      >
        {props.label}
      </Checkbox>
      <Input
        disabled={!props.checked}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onValueChange(event.target.value)}
      />
    </div>
  );
}

function BatchSelectField(props: {
  label: string;
  checked: boolean;
  value: string;
  options: readonly { value: string; label: string }[];
  onCheckedChange: (checked: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <div
      className={`batch-field${props.checked ? "" : " batch-field--inactive"}`}
    >
      <Checkbox
        checked={props.checked}
        onChange={(event) => props.onCheckedChange(event.target.checked)}
      >
        {props.label}
      </Checkbox>
      <Select
        disabled={!props.checked}
        options={[...props.options]}
        value={props.value || undefined}
        onChange={props.onValueChange}
      />
    </div>
  );
}
