import { Input, Select } from "antd";

interface SelectOption {
  value: string;
  label: string;
}

interface FieldEditorProps {
  label: string;
  fieldName: string;
  value: string;
  selectOptions?: SelectOption[];
  onChange: (value: string) => void;
}

export function FieldEditor(props: FieldEditorProps) {
  return (
    <div className="field-editor">
      <div className="field-label">
        <span className="field-title">{props.label}</span>
        <span className="field-key">{props.fieldName}</span>
      </div>
      {props.selectOptions ? (
        <Select
          showSearch
          value={props.value || undefined}
          options={props.selectOptions}
          onChange={props.onChange}
        />
      ) : (
        <Input value={props.value} onChange={(event) => props.onChange(event.target.value)} />
      )}
    </div>
  );
}

// 历史数据可能出现未登记枚举值，补一个临时选项让 Select 仍能展示并保留原值。
// 跟 FieldEditor 同住是因为它是 FieldEditor 的 selectOptions 入参的预处理工具，只在编辑弹窗里用。
export function withUnknownOption<T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string
): SelectOption[] {
  if (!value || options.some((option) => option.value === value)) {
    return options as unknown as SelectOption[];
  }
  return [{ value, label: `未知：${value}` }, ...options];
}
