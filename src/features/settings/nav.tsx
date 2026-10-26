import { createContext, useContext, type ReactNode } from 'react';
import { paths } from '@/app/paths';

/** Where settings links point; dev previews remap them under /dev/settings. */
export interface SettingsNav {
  href: (section?: string) => string;
}

const liveNav: SettingsNav = { href: (section) => (section ? paths.settingsSection(section) : paths.settings) };
const NavContext = createContext<SettingsNav>(liveNav);

export function SettingsNavProvider({ value, children }: { value: SettingsNav; children: ReactNode }) {
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export const useSettingsNav = (): SettingsNav => useContext(NavContext);
