import type { EquipmentRowOk } from "../domain/equipmentRow";
import { encodeText } from "../utils/encoding";
import type { SupportedEncoding } from "../utils/encoding";
import { ensureWritePermission } from "./fileSystem";

export class DirectoryPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DirectoryPermissionError";
  }
}

interface SaveOptions {
  rows: EquipmentRowOk[];
  encoding: SupportedEncoding;
  directoryHandle: FileSystemDirectoryHandle | null;
  concurrency?: number;
}

export interface SaveResult {
  // key → 已成功写入磁盘的 draftText，供调用方同步 originalText 去除 dirty 标记。
  successByKey: Map<string, string>;
  errors: string[];
}

const DEFAULT_CONCURRENCY = 12;

export async function saveEquipmentRows(options: SaveOptions): Promise<SaveResult> {
  const { rows, encoding, directoryHandle } = options;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  // 选目录时虽然申请过 readwrite，但浏览器在 tab 失焦后可能撤回；在写入前对目录整体确认一次权限，
  // 避免每个文件单独触发交互式提示。
  if (directoryHandle) {
    try {
      await ensureWritePermission(directoryHandle);
    } catch (err) {
      throw new DirectoryPermissionError(err instanceof Error ? err.message : String(err));
    }
  }

  const successByKey = new Map<string, string>();
  const errors: string[] = [];

  // worker 模式并发写入；单线程 JS 中 cursor++ 足以分发任务，文件句柄之间互不影响。
  let cursor = 0;
  const writeNext = async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= rows.length) return;
      const row = rows[index];
      try {
        const writable = await row.fileHandle.createWritable();
        try {
          await writable.write(encodeText(row.draftText, encoding));
          await writable.close();
        } catch (innerErr) {
          // close 之前出错时尝试 abort，避免留下 0 字节文件。
          try {
            await writable.abort();
          } catch {
            // 已经关闭或 abort 不支持时忽略。
          }
          throw innerErr;
        }
        successByKey.set(row.key, row.draftText);
      } catch (err) {
        errors.push(`${row.id} | ${row.path} | ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const workerCount = Math.min(concurrency, Math.max(rows.length, 1));
  await Promise.all(Array.from({ length: workerCount }, () => writeNext()));

  return { successByKey, errors };
}
