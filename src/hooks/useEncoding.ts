import { useEffect, useState } from "react";
import { defaultEncoding, isSupportedEncoding } from "../utils/encoding";
import type { SupportedEncoding } from "../utils/encoding";

const STORAGE_KEY = "dnf-equipment-editor:encoding";

function readStored(): SupportedEncoding {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedEncoding(stored)) return stored;
  } catch {
    // 隐私模式或被禁用 storage 时直接走默认值，不打断主流程。
  }
  return defaultEncoding;
}

export function useEncoding(): [SupportedEncoding, (next: SupportedEncoding) => void] {
  const [encoding, setEncoding] = useState<SupportedEncoding>(() => readStored());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, encoding);
    } catch {
      // 同上。
    }
  }, [encoding]);

  return [encoding, setEncoding];
}
