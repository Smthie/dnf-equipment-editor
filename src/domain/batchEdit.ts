import type { BatchEditableField } from "./equipmentFile";

export type BatchFieldState = Record<BatchEditableField, { enabled: boolean; value: string }>;

export const initialBatchFields: BatchFieldState = {
  rarity: { enabled: false, value: "" },
  equipmentType: { enabled: false, value: "" },
  attachType: { enabled: false, value: "" },
  minimumLevel: { enabled: false, value: "" },
  creationRate: { enabled: false, value: "" },
  grade: { enabled: false, value: "" }
};

export interface BatchCollectResult<K extends string> {
  updates: Partial<Record<K, string>>;
  emptyFields: K[];
}

export function collectBatchUpdates<T extends Record<string, { enabled: boolean; value: string }>>(
  batchFields: T
): BatchCollectResult<keyof T & string> {
  // 一次遍历同时收集合法更新和“勾选但空值”的非法项。空值若被写入枚举字段会输出 `\t``\n` 这种损坏文件的内容，
  // 必须在 UI 层拦截。
  const updates: Partial<Record<keyof T & string, string>> = {};
  const emptyFields: Array<keyof T & string> = [];
  for (const field of Object.keys(batchFields) as Array<keyof T & string>) {
    const entry = batchFields[field];
    if (!entry.enabled) continue;
    if (entry.value === "") {
      emptyFields.push(field);
    } else {
      updates[field] = entry.value;
    }
  }
  return { updates, emptyFields };
}
