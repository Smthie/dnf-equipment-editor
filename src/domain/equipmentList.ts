export interface EquipmentListItem {
  id: string;
  path: string;
}

export function parseEquipmentList(lstText: string): EquipmentListItem[] {
  // equipment.lst 以“编号、路径”两行一组组织，空行和注释行不参与解析。
  const lines = lstText
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const items: EquipmentListItem[] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const id = lines[cursor].replace(/`/g, "").trim();
    // id 必须是纯数字；遇到坏行单步前进，避免一次错位让后续所有配对全部失效。
    if (!/^\d+$/.test(id)) {
      cursor += 1;
      continue;
    }
    if (cursor + 1 >= lines.length) break;
    const path = lines[cursor + 1].replace(/^`|`$/g, "").trim();
    if (!path) {
      cursor += 1;
      continue;
    }
    items.push({ id, path });
    cursor += 2;
  }
  return items;
}
