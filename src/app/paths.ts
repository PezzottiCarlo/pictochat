/** Route paths (HashRouter, so they work on GitHub Pages without rewrites). */
export const paths = {
  onboarding: '/benvenuto',
  login: '/accedi',
  chats: '/chat',
  chat: (chatId: string) => `/chat/${encodeURIComponent(chatId)}`,
  pictograms: '/pittogrammi',
  settings: '/impostazioni',
  settingsSection: (section: string) => `/impostazioni/${section}`,
  help: '/aiuto',
  showcase: '/dev/showcase',
} as const;
