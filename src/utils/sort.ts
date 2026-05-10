export function compareTextNumbers(a: string, b: string) {
  const left = parseSortableNumber(a);
  const right = parseSortableNumber(b);

  if (left == null && right == null) return compareText(a, b);
  if (left == null) return 1;
  if (right == null) return -1;
  if (left !== right) return left - right;

  return compareText(a, b);
}

function parseSortableNumber(value: string) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/,/g, "");
  // 业务要求空值视为最小值；降序时 Ant Design 会反转比较结果。
  if (!normalized) return Number.NEGATIVE_INFINITY;

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) return parsed;

  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const matchedNumber = Number(match[0]);
  return Number.isFinite(matchedNumber) ? matchedNumber : null;
}

function compareText(a: string, b: string) {
  // numeric: true 让类似 "2" 和 "10" 的编号按自然数字顺序比较。
  return String(a ?? "").localeCompare(String(b ?? ""), "zh-CN", {
    numeric: true,
    sensitivity: "base"
  });
}
