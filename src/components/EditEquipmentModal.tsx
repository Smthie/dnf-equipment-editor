import { Input, Modal, Segmented } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  applyEquipmentFieldUpdates,
  editableFieldLabels,
  parseEquipmentText,
} from "../domain/equipmentFile";
import type { EditableField } from "../domain/equipmentFile";
import {
  attachTypeOptions,
  equipmentTypeOptions,
  rarityOptions,
} from "../domain/equipmentOptions";
import type { EquipmentRow } from "../domain/equipmentRow";
import { FieldEditor, withUnknownOption } from "./FieldEditor";

type EditMode = "fields" | "raw";

interface EditFieldConfig {
  key: EditableField;
  label: string;
  options?: readonly { value: string; label: string }[];
}

const EDIT_FIELDS: readonly EditFieldConfig[] = [
  { key: "name", label: "名称" },
  { key: "rarity", label: "装备等级", options: rarityOptions },
  { key: "equipmentType", label: "装备类型", options: equipmentTypeOptions },
  { key: "attachType", label: "交易类型", options: attachTypeOptions },
  { key: "minimumLevel", label: "使用等级" },
  { key: "creationRate", label: "掉落概率" },
  { key: "grade", label: "掉落等级" }
];

interface EditEquipmentModalProps {
  row: EquipmentRow | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (rowKey: string, draftText: string) => void;
}

export function EditEquipmentModal(props: EditEquipmentModalProps) {
  // 仅处理 ok 状态的行；error 行没有可编辑文本，外部按钮已经禁用。
  const editableRow = props.row?.kind === "ok" ? props.row : null;
  const [editMode, setEditMode] = useState<EditMode>("fields");
  const [editText, setEditText] = useState("");

  // 字段视图和原始文本视图共享同一份 editText，切换模式不会丢失未确认修改。
  const parsedEditText = useMemo(
    () => (editText ? parseEquipmentText(editText) : null),
    [editText],
  );

  useEffect(() => {
    if (props.open && editableRow) {
      setEditMode("fields");
      setEditText(editableRow.draftText);
    }
  }, [props.open, editableRow]);

  function confirm() {
    if (!editableRow) return;
    props.onConfirm(editableRow.key, editText);
  }

  function updateField(field: EditableField, value: string) {
    // 字段编辑本质上是改写原始文本中的对应字段块，未展示字段会原样保留。
    setEditText((current) =>
      applyEquipmentFieldUpdates(current, { [field]: value }),
    );
  }

  return (
    <Modal
      title={editableRow ? `编辑装备 ${editableRow.id}` : "编辑装备"}
      width={840}
      className="equipment-modal"
      centered
      open={props.open}
      okText="确认"
      cancelText="取消"
      onCancel={props.onCancel}
      onOk={confirm}
      afterClose={() => {
        // 关闭后统一清理状态；其它路径（点 X、取消、确认）都会先触发 onCancel/onOk 再走到这里。
        setEditMode("fields");
        setEditText("");
      }}
    >
      {editableRow && parsedEditText ? (
        <div className="edit-modal-body">
          <div className="modal-context">
            <div className="modal-context-title">
              {parsedEditText.fields.name || "未命名装备"}
            </div>
            <div className="modal-context-path">{editableRow.path}</div>
          </div>
          <Segmented<EditMode>
            block
            value={editMode}
            options={[
              { value: "fields", label: "字段编辑" },
              { value: "raw", label: "原始文件编辑" },
            ]}
            onChange={setEditMode}
          />

          {editMode === "fields" ? (
            <div className="edit-form-grid">
              {EDIT_FIELDS.map((config) => (
                <FieldEditor
                  key={config.key}
                  label={config.label}
                  fieldName={editableFieldLabels[config.key]}
                  value={parsedEditText.fields[config.key]}
                  selectOptions={
                    config.options
                      ? withUnknownOption(config.options, parsedEditText.fields[config.key])
                      : undefined
                  }
                  onChange={(value) => updateField(config.key, value)}
                />
              ))}
            </div>
          ) : (
            <Input.TextArea
              className="raw-editor"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
            />
          )}
        </div>
      ) : null}
    </Modal>
  );
}
