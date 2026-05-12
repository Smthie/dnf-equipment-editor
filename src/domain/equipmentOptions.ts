import { normalizeLineValue } from "./equipmentFile";

export const rarityOptions = [
  { value: "0", label: "普通" },
  { value: "1", label: "高级" },
  { value: "2", label: "稀有" },
  { value: "3", label: "神器" },
  { value: "4", label: "史诗" },
  { value: "5", label: "勇者" },
  { value: "6", label: "传说" },
  { value: "7", label: "神话" }
] as const;

export const MAGIC_SEALED_RARITY_FILTER_VALUE = "__magic_sealed__";

export const rarityFilterOptions = [
  rarityOptions[0],
  rarityOptions[1],
  { value: MAGIC_SEALED_RARITY_FILTER_VALUE, label: "魔法封印" },
  ...rarityOptions.slice(2)
] as const;

export const attachTypeOptions = [
  { value: "[free]", label: "不限制" },
  { value: "[sealing]", label: "封装" },
  { value: "[trade]", label: "不可交易" },
  { value: "[account]", label: "帐号绑定" },
  { value: "[trade delete]", label: "无法交易、删除" },
  { value: "[sealing trade]", label: "封装且不可交易" }
] as const;

export const equipmentTypeOptions = [
  { value: "[title name]", label: "称号" },
  { value: "[weapon]", label: "武器" },
  { value: "[coat]", label: "上衣" },
  { value: "[pants]", label: "下衣" },
  { value: "[hat]", label: "帽子" },
  { value: "[shoulder]", label: "护肩" },
  { value: "[waist]", label: "腰带" },
  { value: "[shoes]", label: "鞋子" },
  { value: "[amulet]", label: "项链" },
  { value: "[wrist]", label: "手镯" },
  { value: "[ring]", label: "戒指" },
  { value: "[support]", label: "辅助装备" },
  { value: "[aurora avatar]", label: "光环" },
  { value: "[magic stone]", label: "魔法石" },
  { value: "[creature]", label: "宠物" },
  { value: "[artifact red]", label: "宠物装备 红" },
  { value: "[artifact blue]", label: "宠物装备 蓝" },
  { value: "[artifact green]", label: "宠物装备 绿" },
  { value: "[skin avatar]", label: "皮肤" },
  { value: "[face avatar]", label: "脸部装扮" },
  { value: "[equipment type]", label: "时装 皮肤" },
  { value: "[pants avatar]", label: "下衣时装" }
] as const;

const rarityMap: Record<string, string> = Object.fromEntries(
  rarityOptions.map((option) => [option.value, option.label])
);

const attachTypeMap: Record<string, string> = Object.fromEntries(
  attachTypeOptions.map((option) => [option.value, option.label])
);

const equipmentTypeMap: Record<string, string> = Object.fromEntries(
  equipmentTypeOptions.map((option) => [option.value, option.label])
);

// 交易类型展示用的样式色调；跟 attachTypeOptions 同源，集中在这里避免散在组件里。
export const attachToneByKey: Record<string, string> = {
  "[free]": "free",
  "[sealing]": "sealing",
  "[trade]": "trade",
  "[account]": "account",
  "[trade delete]": "locked",
  "[sealing trade]": "locked"
};

export const attachLabelByKey: Record<string, string> = Object.fromEntries(
  attachTypeOptions.map((option) => [option.value, option.label])
);

export function getRarityLabel(rarity: string) {
  return rarityMap[String(rarity)] || String(rarity || "");
}

export function normalizeAttachType(value: string | null | undefined) {
  const raw = normalizeLineValue(value);
  const key = raw.toLowerCase().replace(/\s+/g, " ");
  return attachTypeMap[key] || raw;
}

export function normalizeEquipmentType(value: string | null | undefined) {
  const raw = normalizeLineValue(value);
  const key = raw.toLowerCase().replace(/\s+/g, " ");
  return equipmentTypeMap[key] || raw;
}
