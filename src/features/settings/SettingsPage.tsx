import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Input } from 'antd';
import {
  BgColorsOutlined,
  FontSizeOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  PictureOutlined,
  SafetyOutlined,
  SaveOutlined,
  SearchOutlined,
  SoundOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, NavHeader, PageScaffold, Segmented, type StyleWithVars } from '@/components/ui';
import { MainTabBar } from '@/app/MainTabBar';
import { FONT_SCALE_RANGE, THEMES } from '@/theme';
import { useSettings } from '@/stores/settings';
import { useChatSources } from '@/features/chats/sources';
import { NavRow, SettingsGroup, SliderRow } from './components/controls';
import { PinGate } from './pin/PinGate';
import { usePinSession } from './pin/pinSession';
import { useSettingsNav } from './nav';
import { SECTION_GROUPS, getSection, searchSettings, type SectionId } from './sections';
import { AboutSection } from './sections/AboutSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { BackupSection } from './sections/BackupSection';
import { ChatSettingsSection } from './sections/ChatSettingsSection';
import { ParentalSection } from './sections/ParentalSection';
import { PictogramsSettingsSection } from './sections/PictogramsSettingsSection';
import { ProfileSection } from './sections/ProfileSection';
import { ReadingSection } from './sections/ReadingSection';
import { VoiceSection } from './sections/VoiceSection';

const SECTION_UI: Record<SectionId, { icon: ReactNode; Component: ComponentType }> = {
  profilo: { icon: <UserOutlined />, Component: ProfileSection },
  aspetto: { icon: <BgColorsOutlined />, Component: AppearanceSection },
  lettura: { icon: <FontSizeOutlined />, Component: ReadingSection },
  pittogrammi: { icon: <PictureOutlined />, Component: PictogramsSettingsSection },
  chat: { icon: <MessageOutlined />, Component: ChatSettingsSection },
  voce: { icon: <SoundOutlined />, Component: VoiceSection },
  genitori: { icon: <SafetyOutlined />, Component: ParentalSection },
  backup: { icon: <SaveOutlined />, Component: BackupSection },
  informazioni: { icon: <InfoCircleOutlined />, Component: AboutSection },
};

const QUICK_THEMES = ['system', 'light', 'dark', 'liquid-glass'];
const QUICK_LABEL: Record<string, string> = { system: 'Auto', light: 'Chiaro', dark: 'Scuro', 'liquid-glass': 'Vetro' };

function ProfileCard() {
  const { useMe, useAvatarUrl } = useChatSources();
  const me = useMe();
  const avatar = useAvatarUrl(me?.id);
  const role = useSettings((s) => s.role);
  const { href } = useSettingsNav();
  const name = me ? [me.firstName, me.lastName].filter(Boolean).join(' ') : 'Il tuo profilo';
  return (
    <div className="st-group__body">
      <NavRow
        to={href('profilo')}
        icon={<Avatar src={avatar} name={name} size="lg" decorative />}
        label={<span className="st-profile__name">{name}</span>}
        description={role === 'teen' ? 'Lo usa un ragazzo o una ragazza' : 'Lo usa un genitore'}
      />
    </div>
  );
}

function QuickAdjust() {
  const fontScale = useSettings((s) => s.fontScale);
  const themeId = useSettings((s) => s.themeId);
  const set = useSettings((s) => s.set);
  const options = [...QUICK_THEMES, ...(QUICK_THEMES.includes(themeId) ? [] : [themeId])].map((id) => ({
    value: id,
    label: QUICK_LABEL[id] ?? THEMES.find((t) => t.id === id)?.label ?? id,
  }));
  return (
    <SettingsGroup title="Regolazioni veloci">
      <SliderRow
        label="Grandezza del testo"
        value={fontScale}
        min={FONT_SCALE_RANGE.min}
        max={FONT_SCALE_RANGE.max}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        minLabel={<span className="st-step__a st-step__a--sm">A</span>}
        maxLabel={<span className="st-step__a st-step__a--lg">A</span>}
        onChange={(v) => set('fontScale', v)}
      />
      <div className="st-row st-row--stack">
        <span className="st-row__label">Tema</span>
        <Segmented aria-label="Tema" block value={themeId} options={options} onChange={(v) => set('themeId', v)} />
      </div>
    </SettingsGroup>
  );
}

function SettingsIndex() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchSettings(query), [query]);
  const searching = query.trim().length > 0;
  const { href } = useSettingsNav();

  return (
    <div className="st-stack">
      <Input
        className="st-search"
        size="large"
        allowClear
        prefix={<SearchOutlined aria-hidden="true" />}
        placeholder="Cerca un’impostazione"
        aria-label="Cerca un’impostazione"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {searching ? (
        <SettingsGroup title={results.length ? 'Risultati' : `Nessuna impostazione per «${query.trim()}»`}>
          {results.map((r) => {
            const section = getSection(r.section)!;
            return (
              <NavRow
                key={r.label}
                to={href(r.section)}
                icon={SECTION_UI[r.section].icon}
                tone={section.tone}
                label={r.label}
                description={`In ${section.title}`}
              />
            );
          })}
        </SettingsGroup>
      ) : (
        <>
          <ProfileCard />
          <QuickAdjust />
          {SECTION_GROUPS.map((g) => (
            <SettingsGroup key={g.title} title={g.title}>
              {g.ids.map((id) => {
                const s = getSection(id)!;
                return (
                  <NavRow
                    key={id}
                    to={href(id)}
                    icon={SECTION_UI[id].icon}
                    tone={s.tone}
                    label={s.title}
                    description={s.description}
                  />
                );
              })}
            </SettingsGroup>
          ))}
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const touch = usePinSession((s) => s.touch);
  const meta = getSection(section);
  const { href } = useSettingsNav();

  useEffect(() => touch(), [section, touch]);

  if (section && !meta) return <Navigate to={href()} replace />;
  const Section = meta ? SECTION_UI[meta.id].Component : null;

  const header = meta ? (
    <NavHeader
      title={meta.title}
      onBack={() => navigate(href())}
      backLabel="Torna alle impostazioni"
      leading={
        <span className="st-chip st-chip--sm" aria-hidden="true" style={{ '--chip': `var(--cat-${meta.tone})` } as StyleWithVars}>
          {SECTION_UI[meta.id].icon}
        </span>
      }
    />
  ) : (
    <NavHeader large title="Impostazioni" />
  );

  return (
    <PageScaffold header={header} footer={<MainTabBar active="settings" />}>
      <PinGate>
        {Section ? (
          <div className="st-stack">
            <Section />
          </div>
        ) : (
          <SettingsIndex />
        )}
      </PinGate>
    </PageScaffold>
  );
}

