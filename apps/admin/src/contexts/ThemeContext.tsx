import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { theme } from 'antd';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  /** 供 ConfigProvider 使用的 Ant Design 算法 */
  algorithm: typeof theme.defaultAlgorithm;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  isDark: false,
  toggle: () => {},
  setMode: () => {},
  algorithm: theme.defaultAlgorithm,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    // 给 <html> 加 data-theme 属性方便全局 CSS 适配
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const value: ThemeContextValue = {
    mode,
    isDark: mode === 'dark',
    toggle,
    setMode,
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
