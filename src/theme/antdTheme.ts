import type { ThemeConfig } from "antd";

const PRIMARY = "#00A889";
const PRIMARY_HOVER = "#07967E";
const PRIMARY_ACTIVE = "#087C6A";
const PRIMARY_BG = "#E6F7F4";
const PRIMARY_BG_HOVER = "#F0FBF8";
const PRIMARY_BORDER = "#79D4BD";

const INFO = "#3B82F6";
const SUCCESS = "#22C55E";
const WARNING = "#F97316";
const ERROR = "#EF4444";

const TEXT_PRIMARY = "#102033";
const TEXT_SECONDARY = "#475569";
const TEXT_TERTIARY = "#64748B";
const TEXT_QUATERNARY = "#94A3B8";

const BORDER = "#E2E8F0";
const BORDER_SECONDARY = "#EEF2F6";
const BG_CONTAINER = "#FFFFFF";
const BG_LAYOUT = "#F7FAFC";

const FONT_STACK =
  '"PingFang SC","Microsoft YaHei",Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

export const teamTripTheme: ThemeConfig = {
  token: {
    colorPrimary: PRIMARY,
    colorPrimaryHover: PRIMARY_HOVER,
    colorPrimaryActive: PRIMARY_ACTIVE,
    colorPrimaryBg: PRIMARY_BG,
    colorPrimaryBgHover: PRIMARY_BG_HOVER,
    colorPrimaryBorder: PRIMARY_BORDER,

    colorInfo: INFO,
    colorSuccess: SUCCESS,
    colorWarning: WARNING,
    colorError: ERROR,

    colorText: TEXT_PRIMARY,
    colorTextSecondary: TEXT_SECONDARY,
    colorTextTertiary: TEXT_TERTIARY,
    colorTextQuaternary: TEXT_QUATERNARY,

    colorBorder: BORDER,
    colorBorderSecondary: BORDER_SECONDARY,

    colorBgContainer: BG_CONTAINER,
    colorBgLayout: BG_LAYOUT,
    colorBgElevated: BG_CONTAINER,

    borderRadius: 12,
    borderRadiusXS: 6,
    borderRadiusSM: 8,
    borderRadiusLG: 20,

    controlHeight: 44,
    controlHeightSM: 36,
    controlHeightLG: 48,

    fontFamily: FONT_STACK,
    fontSize: 14,
  },
  components: {
    Button: {
      borderRadius: 14,
      controlHeight: 44,
      fontWeight: 600,
      primaryShadow: "0 8px 18px rgba(0, 168, 137, 0.18)",
    },
    Input: {
      borderRadius: 12,
      controlHeight: 44,
      paddingInline: 14,
    },
    Checkbox: {
      borderRadiusSM: 5,
    },
    Form: {
      itemMarginBottom: 20,
      labelFontSize: 14,
    },
  },
};
