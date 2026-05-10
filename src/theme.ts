import { theme } from "antd";
import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  cssVar: { key: "dnf-equipment-theme", prefix: "ant" },
  token: {
    colorPrimary: "#4f46e5",
    colorInfo: "#4f46e5",
    colorSuccess: "#047857",
    colorWarning: "#b45309",
    colorError: "#b91c1c",
    colorTextBase: "#0b1220",
    colorBgBase: "#ffffff",
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    colorBorder: "#e7eaf2",
    colorBorderSecondary: "#eef1f6",
    controlOutlineWidth: 3,
    controlHeight: 34,
    fontSize: 13,
    fontFamily:
      'Inter, "Inter Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    boxShadow:
      "0 1px 1px rgba(15, 23, 42, 0.04), 0 12px 32px -18px rgba(15, 23, 42, 0.18)",
    boxShadowSecondary:
      "0 4px 12px rgba(15, 23, 42, 0.08), 0 32px 64px -28px rgba(15, 23, 42, 0.28)"
  },
  components: {
    Button: { controlHeight: 34, fontWeight: 500, primaryShadow: "none" },
    Input: { controlHeight: 34 },
    Select: { controlHeight: 34 },
    Form: { itemMarginBottom: 0, verticalLabelPadding: "0 0 4px" },
    Table: {
      headerBg: "#fafbfd",
      headerColor: "#5a6271",
      rowHoverBg: "#f7f9fd",
      borderColor: "#eef1f6",
      cellPaddingBlock: 9,
      cellPaddingInline: 12
    },
    Modal: { titleFontSize: 15 },
    Segmented: { itemSelectedBg: "#ffffff" },
    Tag: { defaultBg: "#f1f5f9", defaultColor: "#475569" }
  }
};
