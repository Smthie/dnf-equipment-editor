import { normalizeLineValue } from "./equipmentFile";
import type { EquipmentFields } from "./equipmentFile";
import type { EquipmentRow } from "./equipmentRow";

export interface EquipmentFilters {
  id: string;
  name: string;
  rarity: string;
  equipmentType: string;
  attachType: string;
  minimumLevel: string;
  creationRate: string;
  grade: string;
}

export const initialFilters: EquipmentFilters = {
  id: "",
  name: "",
  rarity: "",
  equipmentType: "",
  attachType: "",
  minimumLevel: "",
  creationRate: "",
  grade: "",
};

export function hasActiveEquipmentFilters(filters: EquipmentFilters) {
  return Object.values(filters).some((value) => String(value ?? "").length > 0);
}

const EMPTY_FIELDS: EquipmentFields = {
  name: "",
  rarity: "",
  equipmentType: "",
  attachType: "",
  minimumLevel: "",
  creationRate: "",
  grade: "",
};

export function filterEquipmentRows(
  rows: EquipmentRow[],
  filters: EquipmentFilters,
) {
  // 枚举字段（rarity / equipmentType / attachType）一律按原始 token 严格比对，避免依赖中文 label。
  // error 行没有字段数据，用空字段做匹配 —— 仅在用户不加任何筛选时仍可出现在列表中。
  return rows.filter((row) => {
    const fields = row.kind === "ok" ? row.fields : EMPTY_FIELDS;
    return (
      matchesText(row.id, filters.id) &&
      includesText(fields.name, filters.name) &&
      matchesToken(fields.rarity, filters.rarity) &&
      matchesToken(fields.equipmentType, filters.equipmentType) &&
      matchesToken(fields.attachType, filters.attachType) &&
      matchesText(fields.minimumLevel, filters.minimumLevel) &&
      matchesText(fields.creationRate, filters.creationRate) &&
      matchesText(fields.grade, filters.grade)
    );
  });
}

function includesText(value: string, query: string) {
  if (isEmptyFilter(query)) return isEmptyValue(value);
  const normalizedQuery = normalizeFilterText(query).toLowerCase();
  if (!normalizedQuery) return true;
  return String(value ?? "")
    .toLowerCase()
    .includes(normalizedQuery);
}

function matchesText(value: string, query: string) {
  if (isEmptyFilter(query)) return isEmptyValue(value);
  const normalizedQuery = normalizeFilterText(query).toLowerCase();
  if (!normalizedQuery) return true;
  return normalizeLineValue(value).toLowerCase() === normalizedQuery;
}

function matchesToken(rawValue: string, filterToken: string) {
  if (isEmptyFilter(filterToken)) return isEmptyValue(rawValue);
  const normalizedFilterToken = normalizeFilterText(filterToken).toLowerCase();
  if (!normalizedFilterToken) return true;
  return normalizeLineValue(rawValue).toLowerCase() === normalizedFilterToken;
}

function normalizeFilterText(value: string) {
  return String(value ?? "").trim();
}

function isEmptyFilter(value: string) {
  return String(value ?? "").length > 0 && normalizeFilterText(value) === "";
}

function isEmptyValue(value: string) {
  return normalizeLineValue(value) === "";
}
