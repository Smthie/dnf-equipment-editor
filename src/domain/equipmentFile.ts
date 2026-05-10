export interface EquipmentFields {
  name: string;
  rarity: string;
  equipmentType: string;
  attachType: string;
  minimumLevel: string;
  creationRate: string;
  grade: string;
}

export interface ParsedEquipmentText {
  fields: EquipmentFields;
  hasRandomOption: boolean;
}

export const editableFieldLabels = {
  name: "name",
  rarity: "rarity",
  equipmentType: "equipment type",
  attachType: "attach type",
  minimumLevel: "minimum level",
  creationRate: "creation rate",
  grade: "grade"
} as const;

export type EditableField = keyof typeof editableFieldLabels;
export type BatchEditableField = Exclude<EditableField, "name">;

// .equ 行值可能被反引号包裹，也可能是 [token] 形式；这里只取第一个有效值用于展示和筛选。
export function normalizeLineValue(value: string | null | undefined) {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  if (raw.startsWith("`")) {
    const closingIndex = raw.indexOf("`", 1);
    if (closingIndex >= 0) {
      return raw.slice(1, closingIndex).trim();
    }
    return raw.slice(1).trim();
  }

  if (raw.startsWith("[")) {
    const closingIndex = raw.indexOf("]");
    if (closingIndex >= 0) {
      return raw.slice(0, closingIndex + 1).trim();
    }
  }

  return raw.split(/\s+/)[0]?.trim() || "";
}

export function parseEquipmentText(text: string): ParsedEquipmentText {
  // 只提取编辑器关心的首个字段块，未识别的原始内容会保留在 draftText 中。
  const fields: EquipmentFields = {
    name: getFirstSectionValue(text, editableFieldLabels.name),
    rarity: getFirstSectionValue(text, editableFieldLabels.rarity),
    equipmentType: getFirstSectionValue(text, editableFieldLabels.equipmentType),
    attachType: getFirstSectionValue(text, editableFieldLabels.attachType),
    minimumLevel: getFirstSectionValue(text, editableFieldLabels.minimumLevel),
    creationRate: getFirstSectionValue(text, editableFieldLabels.creationRate),
    grade: getFirstSectionValue(text, editableFieldLabels.grade)
  };

  return {
    fields,
    hasRandomOption: hasSection(text, "random option")
  };
}

export function setEquipmentField(text: string, field: EditableField, value: string) {
  const label = editableFieldLabels[field];
  return setFirstSectionValue(text, label, value);
}

export function applyEquipmentFieldUpdates(
  text: string,
  updates: Partial<Record<EditableField, string>>
) {
  return (Object.entries(updates) as Array<[EditableField, string]>).reduce(
    (current, [field, value]) => setEquipmentField(current, field, value),
    text
  );
}

function getFirstSectionValue(text: string, label: string) {
  // 字段块格式为 [label] 后跟下一行的值，大小写不敏感。
  const escaped = escapeRegExp(label);
  const regex = new RegExp(`\\[${escaped}\\][^\\S\\r\\n]*(?:\\r\\n|\\n|\\r)([^\\r\\n]*)`, "i");
  const match = text.match(regex);
  return match ? normalizeLineValue(match[1]) : "";
}

function hasSection(text: string, label: string) {
  const escaped = escapeRegExp(label);
  return new RegExp(`\\[${escaped}\\]`, "i").test(text);
}

function setFirstSectionValue(text: string, label: string, value: string) {
  // 优先替换已有字段；如果字段不存在，则在文件末尾追加一个同格式字段块。
  const escaped = escapeRegExp(label);
  const regex = new RegExp(
    `(\\[${escaped}\\][^\\S\\r\\n]*(?:\\r\\n|\\n|\\r))([^\\r\\n]*)`,
    "i"
  );

  const match = text.match(regex);
  if (match) {
    return text.replace(regex, (_, prefix: string, oldLine: string) => {
      return `${prefix}${formatSectionLine(label, value, oldLine)}`;
    });
  }

  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const base = text.replace(/(?:\r?\n)*$/, "");
  const block = `[${label}]${newline}${formatSectionLine(label, value, "")}`;
  return `${base}${newline}${newline}${block}${newline}${newline}`;
}

function formatSectionLine(label: string, value: string, oldLine: string) {
  const indent = oldLine ? oldLine.match(/^\s*/)?.[0] || "\t" : "\t";
  const trimmed = oldLine.trim();
  const cleanValue = String(value ?? "").replace(/^`/, "").replace(/`$/, "");
  // 名称和枚举字段通常需要反引号；已有反引号的行也保持原格式，避免破坏 .equ 语法。
  const shouldWrapWithBackticks =
    label.toLowerCase() === "name" ||
    label.toLowerCase() === "attach type" ||
    label.toLowerCase() === "equipment type" ||
    trimmed.startsWith("`") ||
    trimmed.endsWith("`");

  const suffix = getLineSuffixAfterFirstValue(oldLine);
  return shouldWrapWithBackticks ? `${indent}\`${cleanValue}\`${suffix}` : `${indent}${cleanValue}${suffix}`;
}

function getLineSuffixAfterFirstValue(line: string) {
  // 保留首个值之后的注释或附加内容，减少保存时对原文件非目标区域的扰动。
  const trimmed = line.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("`")) {
    const closingIndex = trimmed.indexOf("`", 1);
    if (closingIndex >= 0) {
      return trimmed.slice(closingIndex + 1);
    }
    return "";
  }

  const match = trimmed.match(/^\S+([\t ].*)$/);
  return match?.[1] || "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
