import { decodeBuffer } from "../utils/encoding";
import type { SupportedEncoding } from "../utils/encoding";

export async function readFileText(
  fileHandle: FileSystemFileHandle,
  encoding: SupportedEncoding
) {
  const file = await fileHandle.getFile();
  const buffer = await file.arrayBuffer();
  return decodeBuffer(buffer, encoding);
}

type PermissionTarget = FileSystemFileHandle | FileSystemDirectoryHandle;

export async function ensureWritePermission(handle: PermissionTarget) {
  const descriptor: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };

  // queryPermission/requestPermission 都是可选 API，兼容不同浏览器的 File System Access 实现。
  if (handle.queryPermission) {
    const current = await handle.queryPermission(descriptor);
    if (current === "granted") return;
  }

  if (handle.requestPermission) {
    const requested = await handle.requestPermission(descriptor);
    if (requested !== "granted") {
      throw new Error("未获得写入权限");
    }
  }
}
