# DNF Equipment 快捷编辑器

一个纯前端的 DNF `equipment` 目录编辑工具。应用通过浏览器的 File System Access API 读取本地 `equipment.lst` 和对应 `.equ` 文件，在页面中完成筛选、排序、单行编辑、批量编辑，并在用户确认后写回本地文件。

## 功能

- 选择本地 `equipment` 文件夹并解析 `equipment.lst`
- 在页面顶部切换文件编码（UTF-8 / GBK / GB18030 / EUC-KR / Big5 / Shift_JIS），切换后会按新编码重新解析当前目录
- 展示装备编号、名称、装备等级、装备类型、交易类型、使用等级、掉落概率、掉落等级
- 支持按编号、装备等级、使用等级、掉落概率、掉落等级排序
- 支持按常用字段筛选装备列表
- 支持单行字段编辑和原始 `.equ` 文本编辑
- 支持勾选多行后批量编辑装备等级、装备类型、交易类型、使用等级、掉落概率、掉落等级
- 支持保存单行或保存全部已编辑行（按当前所选编码写回，多文件并发）
- 支持还原单行或还原全部未保存修改

## 环境要求

- Node.js 18+
- pnpm
- Chrome 或 Edge 等支持 File System Access API 的现代浏览器

Safari 和 Firefox 当前不完整支持目录选择和本地写回能力，无法保证可用。

## 安装与运行

```bash
pnpm install
pnpm run dev
```

开发服务器默认绑定 `127.0.0.1`。启动后在浏览器中打开终端输出的本地地址。

构建生产版本：

```bash
pnpm run build
```

本地预览构建产物：

```bash
pnpm run preview
```

## 使用流程

1. 在页面右上角选择**文件编码**（默认 UTF-8）。错误的编码会让中文 / 韩文名变成乱码，并在保存时**直接破坏原文件**，务必先确认。
2. 点击“选择 equipment 文件夹”。
3. 选择包含 `equipment.lst` 的本地 `equipment` 目录。
4. 等待解析完成，表格会展示成功读取的装备记录。
5. 如果发现名称是乱码，切换编码后会弹确认框并自动按新编码重新解析（未保存的修改会被丢弃）。
6. 使用筛选条件或表头排序定位目标装备。
7. 点击行内编辑按钮进行字段编辑或原始文件编辑。
8. 确认编辑后，修改只保存在页面内存中，真实文件不会立即改变。
9. 点击行内保存或“保存所有行”后，应用会再次请求写入权限并按当前编码并发覆盖对应 `.equ` 文件。

建议在首次批量操作前备份原始 `equipment` 目录。这个工具会尽量只改目标字段，但保存动作本质上仍然是覆盖本地文件。

## 支持的字段

当前编辑器解析和写回以下 `.equ` 字段：

| 页面字段 | `.equ` 字段名    |
| -------- | ---------------- |
| 名称     | `name`           |
| 装备等级 | `rarity`         |
| 装备类型 | `equipment type` |
| 交易类型 | `attach type`    |
| 使用等级 | `minimum level`  |
| 掉落概率 | `creation rate`  |
| 掉落等级 | `grade`          |

未展示的 `.equ` 内容会保留在原始文本中。字段编辑会替换对应字段块的第一行值；如果目标字段不存在，会在文件末尾追加字段块。

## 项目结构

```text
src/
  App.tsx                         应用状态编排：rows 管理、目录选择、保存确认、模态触发
  main.tsx                        React 挂载入口
  theme.ts                        antd ConfigProvider 主题 token
  index.css                       全局样式（含 Tailwind 与自定义 CSS 变量）
  file-system-access.d.ts         File System Access API 的 ambient 类型补充

  hooks/
    useEncoding.ts                文件编码 state + localStorage 持久化

  components/
    AppHeader.tsx                 顶部品牌栏、编码选择器、目录选择按钮
    StatStrip.tsx                 解析结果统计带（总数 / 成功 / 失败 / 已编辑）
    FilterToolbar.tsx             筛选表单 + 批量编辑触发 + 全局保存/还原
    EquipmentTable.tsx            装备表格、行操作按钮、列排序
    EditEquipmentModal.tsx        单行编辑弹窗，含字段编辑与原始文本编辑两模式
    BatchEditModal.tsx            批量编辑弹窗
    FieldEditor.tsx               单字段输入控件（Input / Select）+ withUnknownOption

  domain/
    equipmentFile.ts              .equ 文件解析与字段写回（含 normalizeLineValue）
    equipmentList.ts              equipment.lst 解析
    equipmentOptions.ts           装备枚举常量、label map、attach 样式 tone
    equipmentRow.ts               EquipmentRow 联合类型 + isRowDirty / withParsedText
    filter.ts                     EquipmentFilters 类型与筛选实现
    batchEdit.ts                  BatchFieldState 与 collectBatchUpdates

  services/
    equipmentDirectory.ts         遍历 equipment 目录、并发解析 .equ
    equipmentSave.ts              并发写回与 DirectoryPermissionError
    fileSystem.ts                 File System Access API 句柄低层工具（readFileText / ensureWritePermission）

  utils/
    encoding.ts                   多编码读写：原生 TextDecoder 解码，@zxing/text-encoding polyfill 编码
    sort.ts                       表格列排序工具（compareTextNumbers）
```

### 分层约定

- **`domain/`** —— 纯函数与领域模型，不接触浏览器 API、不引入 React。
- **`services/`** —— 浏览器 API 调用层（File System Access），可调用 `domain/` 和 `utils/`。
- **`components/`** —— React UI，只通过 props/回调与 `App.tsx` 交互。
- **`hooks/`** —— 跨组件复用的 React hook。
- **`utils/`** —— 与领域无关的通用工具。

## 数据安全说明

- 应用不上传文件，所有读取、解析和写回都发生在本机浏览器中。
- 目录访问和文件写入依赖浏览器授权。保存前会对目录整体确认一次 `readwrite` 权限。
- 点击“确认”编辑只更新页面内存中的草稿。
- 点击“保存”才会写回真实 `.equ` 文件，使用当前选择的编码。
- 读取失败的行不会被批量编辑或保存。
- **编码选错会损坏文件**：错误编码下解析出来的字符，写回时会按错误编码再编码一次，几乎必然不可逆地破坏原文件。务必先观察名称是否正确显示再保存。

## 开发约定

- 包管理器使用 `pnpm`
- 类型检查和生产构建统一通过 `pnpm run build`
- `EquipmentRow` 是 `kind: "ok" | "error"` 的联合类型；任何访问 `draftText` / `fileHandle` / `fields` 的代码必须先用 `isRowDirty` / `isRowEditable` 或显式判 `row.kind === "ok"` 收窄。
- 新增解析字段时，需要同步更新：
  - `src/domain/equipmentFile.ts`（`EquipmentFields`、`editableFieldLabels`、`parseEquipmentText` 等）
  - `src/domain/equipmentOptions.ts`，如果字段是枚举
  - `src/domain/filter.ts`（`EquipmentFilters`、`filterEquipmentRows`、`initialFilters`）
  - `src/domain/batchEdit.ts`（`initialBatchFields`），如果字段支持批量编辑
  - `src/components/EditEquipmentModal.tsx` 的 `EDIT_FIELDS`
  - `src/components/BatchEditModal.tsx`，如果字段支持批量编辑
  - `src/components/FilterToolbar.tsx`，如果字段支持筛选
  - `src/components/EquipmentTable.tsx`，如果字段需要表格展示或排序
