import { parseEquipmentText } from "../domain/equipmentFile";
import { parseEquipmentList } from "../domain/equipmentList";
import type { EquipmentRow } from "../domain/equipmentRow";
import type { SupportedEncoding } from "../utils/encoding";
import { readFileText } from "./fileSystem";

interface ParseProgress {
  completed: number;
  total: number;
}

interface ParseDirectoryOptions {
  encoding: SupportedEncoding;
  concurrency?: number;
  onProgress?: (progress: ParseProgress) => void;
}

export async function parseEquipmentDirectory(
  dirHandle: FileSystemDirectoryHandle,
  options: ParseDirectoryOptions
) {
  const { encoding } = options;
  const concurrency = options.concurrency ?? 32;
  const lstHandle = await dirHandle.getFileHandle("equipment.lst");
  const lstText = await readFileText(lstHandle, encoding);
  const items = parseEquipmentList(lstText);
  const rows = new Array<EquipmentRow>(items.length);
  // equipment.lst 往往包含大量同级目录文件，缓存目录句柄可减少重复权限和路径解析成本。
  const directoryCache = new Map<string, Promise<FileSystemDirectoryHandle>>();
  let cursor = 0;
  let completed = 0;
  let lastProgressAt = 0;

  const notifyProgress = (force = false) => {
    // 文件数量较大时频繁 setState 会拖慢 UI，这里按时间节流进度更新。
    const now = performance.now();
    if (!force && now - lastProgressAt < 120 && completed < items.length) return;
    lastProgressAt = now;
    options.onProgress?.({ completed, total: items.length });
  };

  async function worker() {
    for (;;) {
      // 单线程 JS 中递增 cursor 足以分发任务；rows[index] 保证结果顺序和 equipment.lst 一致。
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;

      const item = items[index];
      const key = `${index}:${item.id}:${item.path}`;

      try {
        const fileHandle = await getFileHandleByPathCached(dirHandle, item.path, directoryCache);
        const fileText = await readFileText(fileHandle, encoding);
        const parsed = parseEquipmentText(fileText);

        rows[index] = {
          kind: "ok",
          key,
          id: item.id,
          path: item.path,
          fileHandle,
          originalText: fileText,
          draftText: fileText,
          fields: parsed.fields,
          hasRandomOption: parsed.hasRandomOption
        };
      } catch (err) {
        // 单个 .equ 读取失败不应中断整个目录解析，错误行在表格中独立展示。
        rows[index] = {
          kind: "error",
          key,
          id: item.id,
          path: item.path,
          readError: err instanceof Error ? err.message : String(err)
        };
      } finally {
        completed += 1;
        notifyProgress();
      }
    }
  }

  notifyProgress(true);
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => worker()));
  notifyProgress(true);

  return rows;
}

async function getFileHandleByPathCached(
  rootHandle: FileSystemDirectoryHandle,
  relativePath: string,
  directoryCache: Map<string, Promise<FileSystemDirectoryHandle>>
) {
  // equipment.lst 内路径可能带反引号、./ 或 Windows 分隔符，先统一成浏览器句柄可解析的相对路径。
  const cleanPath = relativePath
    .replace(/^`|`$/g, "")
    .replace(/^\.\//, "")
    .replace(/\\/g, "/")
    .trim();

  const parts = cleanPath.split("/").filter(Boolean);
  if (!parts.length) {
    throw new Error(`无效路径：${relativePath}`);
  }

  if (parts.length === 1) {
    return rootHandle.getFileHandle(parts[0]);
  }

  let current = rootHandle;
  let currentPath = "";
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    let nextHandle = directoryCache.get(currentPath);
    if (!nextHandle) {
      nextHandle = current.getDirectoryHandle(part);
      directoryCache.set(currentPath, nextHandle);
    }
    current = await nextHandle;
  }

  return current.getFileHandle(parts[parts.length - 1]);
}
