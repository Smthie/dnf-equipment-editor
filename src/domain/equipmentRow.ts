import { parseEquipmentText } from "./equipmentFile";
import type { EquipmentFields } from "./equipmentFile";

interface EquipmentRowBase {
  key: string;
  id: string;
  path: string;
}

export interface EquipmentRowOk extends EquipmentRowBase {
  kind: "ok";
  fileHandle: FileSystemFileHandle;
  originalText: string;
  draftText: string;
  fields: EquipmentFields;
  hasRandomOption: boolean;
}

export interface EquipmentRowError extends EquipmentRowBase {
  kind: "error";
  readError: string;
}

export type EquipmentRow = EquipmentRowOk | EquipmentRowError;

export function isRowDirty(row: EquipmentRow): row is EquipmentRowOk {
  // error 行不参与脏检查；类型守卫顺手收窄到 ok 分支，方便调用方直接访问 draftText / fileHandle。
  return row.kind === "ok" && row.draftText !== row.originalText;
}

export function isRowEditable(row: EquipmentRow): row is EquipmentRowOk {
  return row.kind === "ok";
}

export function withParsedText(row: EquipmentRowOk, draftText: string): EquipmentRowOk {
  // draftText 是唯一编辑来源；每次变更后重新解析字段，保证表格列和弹窗内容同步。
  const parsed = parseEquipmentText(draftText);
  return {
    ...row,
    draftText,
    fields: parsed.fields,
    hasRandomOption: parsed.hasRandomOption
  };
}
