import { TextEncoder as LegacyTextEncoder } from "@zxing/text-encoding";

export type SupportedEncoding =
  | "utf-8"
  | "gbk"
  | "gb18030"
  | "euc-kr"
  | "big5"
  | "shift_jis";

export interface EncodingOption {
  value: SupportedEncoding;
  label: string;
}

export const encodingOptions: readonly EncodingOption[] = [
  { value: "utf-8", label: "UTF-8" },
  { value: "gbk", label: "GBK（国服 / 简中）" },
  { value: "gb18030", label: "GB18030" },
  { value: "euc-kr", label: "EUC-KR（韩服）" },
  { value: "big5", label: "Big5（繁中）" },
  { value: "shift_jis", label: "Shift_JIS（日服）" },
] as const;

export const defaultEncoding: SupportedEncoding = "utf-8";

export function isSupportedEncoding(
  value: unknown,
): value is SupportedEncoding {
  return (
    typeof value === "string" &&
    encodingOptions.some((option) => option.value === value)
  );
}

export function decodeBuffer(buffer: ArrayBuffer, encoding: SupportedEncoding) {
  // 浏览器原生 TextDecoder 支持所有常见 DNF 客户端编码。fatal=false 允许遇到非法序列回退到替换字符，避免单文件崩掉整次解析。
  return new TextDecoder(encoding, { fatal: false }).decode(buffer);
}

export function encodeText(
  text: string,
  encoding: SupportedEncoding,
): ArrayBuffer {
  // 原生 TextEncoder 只能输出 UTF-8；非 UTF-8 一律走 polyfill，避免把 GBK / EUC-KR 文件误写成 UTF-8 字节流损坏游戏数据。
  const bytes =
    encoding === "utf-8"
      ? new TextEncoder().encode(text)
      : new LegacyTextEncoder(encoding, {
          NONSTANDARD_allowLegacyEncoding: true,
        }).encode(text);
  // 复制到独立 ArrayBuffer，规避 polyfill 返回的 Uint8Array 在 TS 中被推断为 ArrayBufferLike 的写入兼容性问题。
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
