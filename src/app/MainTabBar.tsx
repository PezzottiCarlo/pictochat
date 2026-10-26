import { MessageOutlined, PictureOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { TabBar, type TabItem } from '@/components/ui';
import { useChats } from '@/services/telegram';
import { useSettings } from '@/stores/settings';
import { paths } from './paths';

export type MainTab = 'chats' | 'pictograms' | 'settings' | 'help';

/** Bottom navigation shared by the top-level pages. */
export function MainTabBar({ active }: { active: MainTab }) {
  const { chats } = useChats();
  const simpleMode = useSettings((s) => s.simpleMode);
  const unread = chats.reduce((sum, c) => sum + (c.muted ? 0 : c.unreadCount), 0);

  const items: TabItem[] = [
    { key: 'chats', label: 'Chat', icon: <MessageOutlined />, to: paths.chats, badge: unread || undefined },
    { key: 'pictograms', label: 'Pittogrammi', icon: <PictureOutlined />, to: paths.pictograms },
    { key: 'settings', label: 'Impostazioni', icon: <SettingOutlined />, to: paths.settings },
    { key: 'help', label: 'Aiuto', icon: <QuestionCircleOutlined />, to: paths.help },
  ];

  return (
    <TabBar
      aria-label="Navigazione principale"
      activeKey={active}
      items={simpleMode ? items.filter((i) => i.key !== 'pictograms') : items}
    />
  );
}
