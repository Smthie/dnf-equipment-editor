import { ConfigProvider, Modal, message } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Key } from "react";
import { collectBatchUpdates } from "./domain/batchEdit";
import type { BatchFieldState } from "./domain/batchEdit";
import { applyEquipmentFieldUpdates } from "./domain/equipmentFile";
import {
  isRowDirty,
  isRowEditable,
  withParsedText
} from "./domain/equipmentRow";
import type { EquipmentRow } from "./domain/equipmentRow";
import { filterEquipmentRows, initialFilters } from "./domain/filter";
import type { EquipmentFilters } from "./domain/filter";
import { AppHeader } from "./components/AppHeader";
import type { EncodingLockReason } from "./components/AppHeader";
import { BatchEditModal } from "./components/BatchEditModal";
import { EditEquipmentModal } from "./components/EditEquipmentModal";
import { EquipmentTable } from "./components/EquipmentTable";
import { ExcludeSelectedModal } from "./components/ExcludeSelectedModal";
import { FilterToolbar } from "./components/FilterToolbar";
import { StatStrip } from "./components/StatStrip";
import { useEncoding } from "./hooks/useEncoding";
import { parseEquipmentDirectory } from "./services/equipmentDirectory";
import {
  DirectoryPermissionError,
  saveEquipmentRows
} from "./services/equipmentSave";
import { appTheme } from "./theme";
import type { SupportedEncoding } from "./utils/encoding";

function App() {
  const [rows, setRows] = useState<EquipmentRow[]>([]);
  // 弹窗回调可能在状态更新后才执行，保存时用 ref 读取最新行数据，避免闭包拿到旧 rows。
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState("");
  const [status, setStatus] = useState("请选择本地 equipment 文件夹开始解析。");
  const [loading, setLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [filters, setFilters] = useState<EquipmentFilters>(initialFilters);
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [excludeSelectedOpen, setExcludeSelectedOpen] = useState(false);
  const [encoding, setEncoding] = useEncoding();
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const stats = useMemo(() => {
    const total = rows.length;
    const failed = rows.filter((row) => row.kind === "error").length;
    const dirty = rows.filter(isRowDirty).length;
    return { total, ok: total - failed, failed, dirty };
  }, [rows]);

  const filteredRows = useMemo(() => filterEquipmentRows(rows, filters), [filters, rows]);

  // 批量编辑和保存只允许作用在成功读取的行上，读取失败的行需要保留错误状态供用户排查。
  const selectedEditableRows = useMemo(() => {
    const selectedSet = new Set(selectedRowKeys.map(String));
    return rows.filter((row) => selectedSet.has(row.key) && isRowEditable(row));
  }, [rows, selectedRowKeys]);

  const editingRow = useMemo(() => rows.find((row) => row.key === editingRowKey) || null, [editingRowKey, rows]);
  const dirtyRows = useMemo(() => rows.filter(isRowDirty), [rows]);

  const encodingLockReason: EncodingLockReason | null = loading
    ? "loading"
    : savingKeys.size > 0
      ? "saving"
      : dirtyRows.length > 0
        ? "dirty"
        : null;

  const parseDirectory = useCallback(
    async (dirHandle: FileSystemDirectoryHandle, targetEncoding: SupportedEncoding) => {
      setLoading(true);
      setRows([]);
      setSelectedRowKeys([]);
      setStatus(`正在以 ${targetEncoding.toUpperCase()} 编码解析 ${dirHandle.name}...`);

      try {
        const startedAt = performance.now();
        // 解析阶段只读取本地文件并生成草稿；真正写回文件必须经过用户点击保存确认。
        const parsedRows = await parseEquipmentDirectory(dirHandle, {
          encoding: targetEncoding,
          concurrency: 48,
          onProgress: ({ completed, total }) => {
            setStatus(`已选择目录：${dirHandle.name}，解析进度 ${completed}/${total}`);
          }
        });

        setRows(parsedRows);
        const failed = parsedRows.filter((row) => row.kind === "error").length;
        const seconds = ((performance.now() - startedAt) / 1000).toFixed(2);
        setStatus(
          `解析完成（${targetEncoding.toUpperCase()}）：共 ${parsedRows.length} 条，成功 ${parsedRows.length - failed} 条，失败 ${failed} 条，用时 ${seconds}s。`
        );
        messageApi.success("equipment 目录解析完成");
      } catch (err) {
        setStatus(`读取失败：${err instanceof Error ? err.message : String(err)}。请确认选择的是包含 equipment.lst 的 equipment 文件夹。`);
        messageApi.error("读取 equipment.lst 失败");
      } finally {
        setLoading(false);
      }
    },
    [messageApi]
  );

  async function pickDirectory() {
    if (!window.showDirectoryPicker) {
      setStatus("当前浏览器不支持本地目录选择，请使用最新版 Chrome 或 Edge。");
      messageApi.error("浏览器不支持 File System Access API");
      return;
    }

    setStatus("正在请求目录访问权限...");

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await window.showDirectoryPicker({ id: "dnf-equipment", mode: "readwrite" });
    } catch (err) {
      // 用户主动关闭选择框会抛 AbortError，与真实异常区分开。
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("已取消选择目录。");
        return;
      }
      setStatus(`选择目录失败：${err instanceof Error ? err.message : String(err)}`);
      messageApi.error("选择目录失败");
      return;
    }

    directoryHandleRef.current = dirHandle;
    setDirectoryName(dirHandle.name);
    await parseDirectory(dirHandle, encoding);
  }

  function changeEncoding(nextEncoding: SupportedEncoding) {
    if (nextEncoding === encoding) return;

    const dirHandle = directoryHandleRef.current;
    if (!dirHandle) {
      // 还没解析目录，直接换默认编码。
      setEncoding(nextEncoding);
      return;
    }

    modal.confirm({
      title: `切换文件编码为 ${nextEncoding.toUpperCase()}？`,
      content: "切换后将立即按新编码重新解析当前目录，已加载的草稿状态会被丢弃。",
      centered: true,
      okText: "重新解析",
      cancelText: "取消",
      onOk: async () => {
        setEncoding(nextEncoding);
        await parseDirectory(dirHandle, nextEncoding);
      }
    });
  }

  function updateFilter(field: keyof EquipmentFilters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function confirmEdit(rowKey: string, draftText: string) {
    // 字段编辑和原始文本编辑都会落到 draftText，保存前只更新内存态，降低误写真实文件的风险。
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.key === rowKey && row.kind === "ok" ? withParsedText(row, draftText) : row
      )
    );
    setEditingRowKey(null);
    messageApi.success("已确认修改，保存前不会写入真实文件");
  }

  function restoreRow(rowKey: string) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.key === rowKey && row.kind === "ok" ? withParsedText(row, row.originalText) : row
      )
    );
    messageApi.success("已还原该行修改");
  }

  function restoreAllDirtyRows() {
    if (!dirtyRows.length) return;
    modal.confirm({
      title: "还原所有已编辑行？",
      content: `即将撤销 ${dirtyRows.length} 行尚未保存的修改，不会触碰真实文件。`,
      centered: true,
      okText: "确认还原",
      cancelText: "取消",
      onOk: () => {
        const dirtySet = new Set(dirtyRows.map((row) => row.key));
        setRows((currentRows) =>
          currentRows.map((row) =>
            dirtySet.has(row.key) && row.kind === "ok" ? withParsedText(row, row.originalText) : row
          )
        );
        messageApi.success(`已还原 ${dirtyRows.length} 行`);
      }
    });
  }

  function confirmBatchEdit(batchFields: BatchFieldState) {
    const { updates, emptyFields } = collectBatchUpdates(batchFields);
    if (emptyFields.length) {
      messageApi.warning("已勾选字段必须填写值，未填写的字段请取消勾选");
      return;
    }
    if (!Object.keys(updates).length) {
      messageApi.warning("请至少启用一个批量编辑字段");
      return;
    }

    const selectedSet = new Set(selectedEditableRows.map((row) => row.key));
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (!selectedSet.has(row.key) || row.kind !== "ok") return row;
        // 批量编辑复用单行文本改写逻辑，保证字段格式和单行编辑保持一致。
        return withParsedText(row, applyEquipmentFieldUpdates(row.draftText, updates));
      })
    );

    setBatchOpen(false);
    messageApi.success(`已批量确认 ${selectedEditableRows.length} 行，保存前不会写入真实文件`);
  }

  function confirmExcludeSelected(excludedRowKeys: string[]) {
    if (!excludedRowKeys.length) {
      messageApi.warning("没有匹配排除条件的选中项");
      return;
    }

    const excludedKeySet = new Set(excludedRowKeys);
    setSelectedRowKeys((currentKeys) =>
      currentKeys.filter((key) => !excludedKeySet.has(String(key)))
    );
    setExcludeSelectedOpen(false);
    messageApi.success(`已从多选中排除 ${excludedRowKeys.length} 行`);
  }

  function confirmSaveRows(rowKeys: string[]) {
    const rowKeySet = new Set(rowKeys);
    const rowsToSave = rowsRef.current.filter(isRowDirty).filter((row) => rowKeySet.has(row.key));

    if (!rowsToSave.length) {
      messageApi.info("没有需要保存的修改");
      return;
    }

    modal.confirm({
      title: "确认写入真实 .equ 文件？",
      content: `即将以 ${encoding.toUpperCase()} 编码保存 ${rowsToSave.length} 行装备修改。该操作会覆盖本地 equipment 目录内对应文件，请确认改动无误。`,
      centered: true,
      okText: "确认写入",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        await runSave(rowsToSave.map((row) => row.key));
      }
    });
  }

  async function runSave(rowKeys: string[]) {
    const rowKeySet = new Set(rowKeys);
    const rowsToSave = rowsRef.current.filter(isRowDirty).filter((row) => rowKeySet.has(row.key));
    const keys = rowsToSave.map((row) => row.key);

    setSavingKeys((current) => new Set([...current, ...keys]));

    let result;
    try {
      result = await saveEquipmentRows({
        rows: rowsToSave,
        encoding,
        directoryHandle: directoryHandleRef.current
      });
    } catch (err) {
      setSavingKeys((current) => {
        const next = new Set(current);
        keys.forEach((key) => next.delete(key));
        return next;
      });
      if (err instanceof DirectoryPermissionError) {
        modal.error({ title: "未获得目录写入权限", content: err.message, centered: true });
      } else {
        modal.error({ title: "保存失败", content: err instanceof Error ? err.message : String(err), centered: true });
      }
      return;
    }

    const { successByKey, errors } = result;

    if (successByKey.size) {
      setRows((currentRows) =>
        currentRows.map((row) => {
          if (row.kind !== "ok") return row;
          const savedText = successByKey.get(row.key);
          if (!savedText || row.draftText !== savedText) return row;
          // 写入成功后同步 originalText，脏行标记会自然消失。
          return { ...row, originalText: savedText };
        })
      );
    }

    setSavingKeys((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.delete(key));
      return next;
    });

    if (errors.length) {
      modal.error({
        title: "部分文件保存失败",
        centered: true,
        content: (
          <div className="max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-6">
            {errors.slice(0, 30).join("\n")}
            {errors.length > 30 ? `\n... 还有 ${errors.length - 30} 条` : ""}
          </div>
        )
      });
    }

    if (successByKey.size) {
      messageApi.success(`已保存 ${successByKey.size} 行`);
    }
  }

  return (
    <ConfigProvider theme={appTheme}>
      {modalContextHolder}
      {messageContextHolder}
      <div className="app-shell dnf-equipment-theme">
        <AppHeader
          directoryName={directoryName}
          loading={loading}
          encoding={encoding}
          encodingLockReason={encodingLockReason}
          onEncodingChange={changeEncoding}
          onPickDirectory={pickDirectory}
        />
        <main className="workspace">
          <StatStrip status={status} stats={stats} />
          <FilterToolbar
            filters={filters}
            visibleCount={filteredRows.length}
            selectedCount={selectedEditableRows.length}
            dirtyCount={dirtyRows.length}
            saving={savingKeys.size > 0}
            onFilterChange={updateFilter}
            onOpenExcludeSelected={() => setExcludeSelectedOpen(true)}
            onOpenBatch={() => setBatchOpen(true)}
            onRestoreAll={restoreAllDirtyRows}
            onSaveAll={() => confirmSaveRows(dirtyRows.map((row) => row.key))}
          />
          <EquipmentTable
            rows={filteredRows}
            allRowsCount={rows.length}
            loading={loading}
            selectedRowKeys={selectedRowKeys}
            savingKeys={savingKeys}
            onSelectionChange={(keys: Key[]) => setSelectedRowKeys(keys)}
            onEdit={(row) => setEditingRowKey(row.key)}
            onSave={(row) => confirmSaveRows([row.key])}
            onRestore={(row) => restoreRow(row.key)}
          />
        </main>
        <EditEquipmentModal
          open={Boolean(editingRow)}
          row={editingRow}
          onCancel={() => setEditingRowKey(null)}
          onConfirm={confirmEdit}
        />
        <BatchEditModal
          open={batchOpen}
          selectedCount={selectedEditableRows.length}
          onCancel={() => setBatchOpen(false)}
          onConfirm={confirmBatchEdit}
        />
        <ExcludeSelectedModal
          open={excludeSelectedOpen}
          selectedRows={selectedEditableRows}
          onCancel={() => setExcludeSelectedOpen(false)}
          onConfirm={confirmExcludeSelected}
        />
      </div>
    </ConfigProvider>
  );
}

export default App;
