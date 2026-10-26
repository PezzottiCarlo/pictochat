import { theme } from 'antd';

export const iosTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#0a84ff',
    colorInfo: '#0a84ff',
    colorSuccess: '#34c759',
    colorError: '#ff3b30',
    colorWarning: '#ff9f0a',
    colorBgBase: '#f2f2f7',
    colorBgLayout: '#f2f2f7',
    colorBgContainer: '#ffffff',
    colorBorder: '#e5e5ea',
    borderRadius: 14,
    borderRadiusLG: 18,
    controlHeight: 48,
    controlHeightLG: 52,
    fontSize: 18,
  },
  components: {
    Button: { controlHeight: 48, borderRadius: 14, fontSize: 18 },
    Input: { controlHeight: 48, borderRadius: 14, fontSize: 18 },
    Tabs: { itemActiveColor: '#0a84ff' },
    Card: { borderRadiusLG: 18 },
  }
} as const;

export type IOSTheme = typeof iosTheme;
