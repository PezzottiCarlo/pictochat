/**
 * Dev-only design system showcase (route /dev/showcase): every primitive, every theme, and live
 * controls for all look & accessibility settings. Writes to the real settings store.
 */
import { useEffect, useState } from 'react';
import { App as AntdApp, Button, Input, Modal, Slider, Switch } from 'antd';
import {
  BellOutlined,
  CommentOutlined,
  HeartOutlined,
  MessageOutlined,
  PictureOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Pictogram, PictogramToken, Settings } from '@/core/types';
import { DEFAULT_SETTINGS, useSettings } from '@/stores/settings';
import {
  Avatar,
  EmptyState,
  IconButton,
  NavHeader,
  PageScaffold,
  PictoStrip,
  PictoTile,
  Segmented,
  Sheet,
  Surface,
  TabBar,
} from '@/components/ui';
import { ACCENT_PRESETS } from './accent';
import { FONT_SCALE_RANGE } from './a11y';
import { useResolvedTheme, useThemeState } from './context';
import { SYSTEM_THEME, THEMES } from './themes';
import type { CategoryColor } from './palettes';
import './Showcase.css';

const picto = (id: number, word: string, category?: CategoryColor): Pictogram => ({
  id: String(id),
  word,
  url: `https://static.arasaac.org/pictograms/${id}/${id}_500.png`,
  source: 'arasaac',
  category,
});

const TILES: Pictogram[] = [
  picto(31807, 'io', 'person'),
  picto(5441, 'volere', 'verb'),
  picto(2349, 'mangiare', 'verb'),
  picto(2527, 'pizza', 'noun'),
  picto(2248, 'acqua', 'noun'),
  picto(2859, 'parco', 'place'),
  picto(3082, 'scuola', 'place'),
  { id: 'p:ciao', word: 'ciao', url: '', source: 'personal', category: 'social' },
  { id: 'p:oggi', word: 'oggi', url: '', source: 'personal', category: 'time' },
  { id: 'broken', word: 'immagine rotta', url: 'https://static.arasaac.org/pictograms/0/0_500.png', source: 'arasaac', category: 'misc' },
];

const SENTENCE: PictogramToken[] = [
  { text: 'Io', lemma: 'io', pictogram: TILES[0] },
  { text: 'voglio', lemma: 'volere', pictogram: TILES[1] },
  { text: 'mangiare', lemma: 'mangiare', pictogram: TILES[2] },
  { text: 'la', lemma: 'la', skipped: true },
  { text: 'pizza', lemma: 'pizza', pictogram: TILES[3] },
  { text: 'al', lemma: 'al', skipped: true },
  { text: 'parco', lemma: 'parco', pictogram: TILES[5] },
  { text: 'subito', lemma: 'subito' },
];

const colorOf = (t: PictogramToken) => (t.pictogram?.category as CategoryColor | undefined) ?? null;

const STRESS: Partial<Settings> = {
  fontScale: 1.8,
  uppercase: true,
  letterSpacing: 'wider',
  lineHeight: 'loose',
  touchSize: 'xl',
  boldText: true,
  pictogramSize: 'xl',
};

export function Showcase() {
  const s = useSettings();
  const theme = useResolvedTheme();
  const { prefs } = useThemeState();
  const { message } = AntdApp.useApp();
  const [tab, setTab] = useState('chat');
  const [selected, setSelected] = useState<string[]>(['2527']);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'pictograms' | 'keyboard'>('pictograms');

  // Dev convenience: ?theme=<id>&stress=1&accent=<hex> (handy for screenshots).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const patch: Partial<Settings> = {};
    if (q.get('theme')) patch.themeId = q.get('theme')!;
    if (q.get('accent')) patch.accentColor = `#${q.get('accent')!.replace('#', '')}`;
    if (q.get('stress')) Object.assign(patch, STRESS);
    if (q.get('reset')) Object.assign(patch, pickLook(DEFAULT_SETTINGS));
    if (Object.keys(patch).length) useSettings.getState().patch(patch);
  }, []);

  const toggle = (p: Pictogram) =>
    setSelected((cur) => (cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id]));

  return (
    <PageScaffold
      header={
        <NavHeader
          large
          title="Showcase"
          subtitle={`Tema: ${theme.label}${prefs.glass ? ' · vetro attivo' : ''}`}
          trailing={
            <>
              <IconButton icon={<SearchOutlined />} aria-label="Cerca" />
              <IconButton icon={<BellOutlined />} aria-label="Notifiche" badge={3} />
            </>
          }
        />
      }
      footer={
        <TabBar
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'chat', label: 'Chat', icon: <MessageOutlined />, badge: 2 },
            { key: 'contacts', label: 'Contatti', icon: <TeamOutlined /> },
            { key: 'phrases', label: 'Frasi', icon: <HeartOutlined /> },
            { key: 'settings', label: 'Impostazioni', icon: <SettingOutlined /> },
          ]}
        />
      }
    >
      <div className="sc">
        {/* ---------------------------------------------------------------- controls */}
        <section aria-labelledby="sc-theme">
          <h2 id="sc-theme" className="pc-section-title">
            Tema
          </h2>
          <div className="sc-themes" role="group" aria-label="Scegli il tema">
            {[SYSTEM_THEME, ...THEMES].map((t) => {
              const active = s.themeId === t.id;
              const scope = t.id === 'system' ? 'light' : t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className="sc-theme-card"
                  aria-pressed={active}
                  onClick={() => s.set('themeId', t.id)}
                >
                  <span className="sc-theme-card__preview" data-theme-scope={scope} aria-hidden="true">
                    <span className="sc-mini-bubble sc-mini-bubble--in">Ciao!</span>
                    <span className="sc-mini-bubble sc-mini-bubble--out">Ciao 👋</span>
                  </span>
                  <span className="sc-theme-card__label">{t.label}</span>
                  <span className="sc-theme-card__desc">{t.description}</span>
                </button>
              );
            })}
          </div>

          <h3 className="sc-sub">Colore principale</h3>
          <div className="sc-swatches" role="radiogroup" aria-label="Colore principale">
            <button
              type="button"
              role="radio"
              aria-checked={s.accentColor === null}
              className="sc-swatch sc-swatch--auto"
              onClick={() => s.set('accentColor', null)}
            >
              <span>Del tema</span>
            </button>
            {ACCENT_PRESETS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={s.accentColor === a.color}
                aria-label={a.label}
                title={a.label}
                className="sc-swatch"
                style={{ background: a.color }}
                onClick={() => s.set('accentColor', a.color)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="sc-read">
          <h2 id="sc-read" className="pc-section-title">
            Lettura
          </h2>
          <Surface className="sc-controls">
            <Field label={`Dimensione testo: ${Math.round(s.fontScale * 100)}%`}>
              <Slider
                min={FONT_SCALE_RANGE.min}
                max={FONT_SCALE_RANGE.max}
                step={0.05}
                value={s.fontScale}
                onChange={(v) => s.set('fontScale', v)}
                tooltip={{ open: false }}
                aria-label="Dimensione testo"
              />
            </Field>
            <Field label="Spazio tra le lettere">
              <Segmented
                block
                aria-label="Spazio tra le lettere"
                value={s.letterSpacing}
                onChange={(v) => s.set('letterSpacing', v)}
                options={[
                  { value: 'normal', label: 'Normale' },
                  { value: 'wide', label: 'Ampio' },
                  { value: 'wider', label: 'Molto ampio' },
                ]}
              />
            </Field>
            <Field label="Spazio tra le righe">
              <Segmented
                block
                aria-label="Spazio tra le righe"
                value={s.lineHeight}
                onChange={(v) => s.set('lineHeight', v)}
                options={[
                  { value: 'normal', label: 'Normale' },
                  { value: 'relaxed', label: 'Comodo' },
                  { value: 'loose', label: 'Ampio' },
                ]}
              />
            </Field>
            <Toggle label="Font per dislessia (OpenDyslexic)" checked={s.dyslexicFont} onChange={(v) => s.set('dyslexicFont', v)} />
            <Toggle label="STAMPATELLO" checked={s.uppercase} onChange={(v) => s.set('uppercase', v)} />
            <Toggle label="Testo in grassetto" checked={s.boldText} onChange={(v) => s.set('boldText', v)} />
          </Surface>
        </section>

        <section aria-labelledby="sc-touch">
          <h2 id="sc-touch" className="pc-section-title">
            Tocco, movimento, trasparenza
          </h2>
          <Surface className="sc-controls">
            <Field label="Grandezza dei pulsanti">
              <Segmented
                block
                aria-label="Grandezza dei pulsanti"
                value={s.touchSize}
                onChange={(v) => s.set('touchSize', v)}
                options={[
                  { value: 'comfortable', label: 'Normale' },
                  { value: 'large', label: 'Grande' },
                  { value: 'xl', label: 'Enorme' },
                ]}
              />
            </Field>
            <Field label="Riduci animazioni">
              <Segmented
                block
                aria-label="Riduci animazioni"
                value={s.reduceMotion}
                onChange={(v) => s.set('reduceMotion', v)}
                options={[
                  { value: 'system', label: 'Automatico' },
                  { value: 'on', label: 'Sì' },
                  { value: 'off', label: 'No' },
                ]}
              />
            </Field>
            <Field label="Riduci trasparenza">
              <Segmented
                block
                aria-label="Riduci trasparenza"
                value={s.reduceTransparency}
                onChange={(v) => s.set('reduceTransparency', v)}
                options={[
                  { value: 'system', label: 'Automatico' },
                  { value: 'on', label: 'Sì' },
                  { value: 'off', label: 'No' },
                ]}
              />
            </Field>
            <Field label={`Effetto vetro: ${Math.round(s.glassIntensity * 100)}%`}>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={s.glassIntensity}
                onChange={(v) => s.set('glassIntensity', v)}
                tooltip={{ open: false }}
                disabled={!theme.glass}
                aria-label="Effetto vetro"
              />
            </Field>
          </Surface>
        </section>

        <section aria-labelledby="sc-picto-settings">
          <h2 id="sc-picto-settings" className="pc-section-title">
            Pittogrammi
          </h2>
          <Surface className="sc-controls">
            <Field label="Grandezza">
              <Segmented
                block
                aria-label="Grandezza pittogrammi"
                value={s.pictogramSize}
                onChange={(v) => s.set('pictogramSize', v)}
                options={[
                  { value: 'sm', label: 'S' },
                  { value: 'md', label: 'M' },
                  { value: 'lg', label: 'L' },
                  { value: 'xl', label: 'XL' },
                ]}
              />
            </Field>
            <Field label="Parola">
              <Segmented
                block
                aria-label="Posizione della parola"
                value={s.pictogramLabel}
                onChange={(v) => s.set('pictogramLabel', v)}
                options={[
                  { value: 'below', label: 'Sotto' },
                  { value: 'above', label: 'Sopra' },
                  { value: 'hidden', label: 'Nascosta' },
                ]}
              />
            </Field>
            <Toggle label="Colori delle categorie" checked={s.categoryColors} onChange={(v) => s.set('categoryColors', v)} />
          </Surface>
          <div className="sc-row sc-row--actions">
            <Button size="large" onClick={() => s.patch(STRESS)}>
              Prova il caso estremo
            </Button>
            <Button size="large" onClick={() => s.patch(pickLook(DEFAULT_SETTINGS))}>
              Ripristina
            </Button>
          </div>
        </section>

        {/* -------------------------------------------------------------- primitives */}
        <section aria-labelledby="sc-tiles">
          <h2 id="sc-tiles" className="pc-section-title">
            PictoTile
          </h2>
          <p className="sc-hint">Tocca per selezionare, tieni premuto (o tasto destro) per ascoltare.</p>
          <div className="sc-tiles">
            {TILES.map((p) => (
              <PictoTile
                key={p.id}
                pictogram={p}
                selected={selected.includes(p.id)}
                onPress={toggle}
                onLongPress={(pp) => message.info(`Ascolta: ${pp.word}`)}
              />
            ))}
          </div>
          <div className="sc-tiles sc-tiles--sizes">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <PictoTile key={size} pictogram={TILES[3]} size={size} label={`pizza ${size}`} />
            ))}
          </div>
        </section>

        <section aria-labelledby="sc-strip">
          <h2 id="sc-strip" className="pc-section-title">
            PictoStrip e messaggi
          </h2>
          <div className="sc-chat">
            <div className="sc-msg sc-msg--in">
              <Avatar name="Mamma" size="sm" presence="online" decorative />
              <div className="sc-bubble sc-bubble--in">
                <p>Io voglio mangiare la pizza al parco subito</p>
                <PictoStrip tokens={SENTENCE} size="sm" colorOf={colorOf} />
              </div>
            </div>
            <div className="sc-msg sc-msg--out">
              <div className="sc-bubble sc-bubble--out">
                <p>Sì! Arrivo 🏃</p>
              </div>
            </div>
          </div>
          <Surface variant="glass" lens padding={2} className="sc-composer">
            <Segmented
              aria-label="Modo di scrittura"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pictograms', label: 'Pittogrammi', icon: <PictureOutlined /> },
                { value: 'keyboard', label: 'Tastiera', icon: <CommentOutlined /> },
              ]}
            />
            <PictoStrip
              tokens={SENTENCE}
              colorOf={colorOf}
              onTokenPress={(t) => message.info(t.text)}
              onTokenLongPress={(t) => message.info(`Ascolta: ${t.text}`)}
            />
            <div className="sc-row">
              <IconButton icon={<SoundOutlined />} aria-label="Leggi ad alta voce" variant="tinted" />
              <Input size="large" placeholder="Scrivi un messaggio" aria-label="Messaggio" className="sc-grow" />
              <IconButton icon={<SendOutlined />} aria-label="Invia" variant="glass" size="lg" />
            </div>
          </Surface>
        </section>

        <section aria-labelledby="sc-buttons">
          <h2 id="sc-buttons" className="pc-section-title">
            IconButton, Avatar, Segmented
          </h2>
          <div className="sc-row">
            <IconButton icon={<SoundOutlined />} aria-label="Plain" />
            <IconButton icon={<SoundOutlined />} aria-label="Tinted" variant="tinted" />
            <IconButton icon={<SoundOutlined />} aria-label="Filled" variant="filled" />
            <IconButton icon={<SendOutlined />} aria-label="Glass" variant="glass" />
            <IconButton icon={<BellOutlined />} aria-label="Danger" variant="danger" badge />
            <IconButton icon={<SendOutlined />} aria-label="Grande" variant="filled" size="lg" />
            <IconButton icon={<SendOutlined />} aria-label="Disabilitato" variant="filled" disabled />
          </div>
          <div className="sc-row">
            <Avatar name="Mamma" presence="online" />
            <Avatar name="Papà Giovanni" size="lg" />
            <Avatar name="Luca Bianchi" size="md" presence={{ state: 'online' }} />
            <Avatar name="Sara" size="sm" />
            <Avatar name="Nonna Rosa" size="xl" presence="online" />
            <Avatar name="Foto rotta" src="https://example.invalid/x.jpg" />
          </div>
          <Segmented
            block
            stacked
            aria-label="Esempio con icone"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'pictograms', label: 'Pittogrammi', icon: <PictureOutlined /> },
              { value: 'keyboard', label: 'Tastiera', icon: <CommentOutlined /> },
            ]}
          />
        </section>

        <section aria-labelledby="sc-surfaces">
          <h2 id="sc-surfaces" className="pc-section-title">
            Surface
          </h2>
          <div className="sc-surfaces">
            <Surface>
              <strong>Plain</strong>
              <p className="pc-text-secondary">Scheda opaca per liste e impostazioni.</p>
            </Surface>
            <Surface variant="glass" lens>
              <strong>Glass</strong>
              <p className="pc-text-secondary">Vetro nei temi Vetro, solida negli altri.</p>
            </Surface>
            <Surface variant="inset">
              <strong>Inset</strong>
              <p className="pc-text-secondary">Area incassata per gruppi di controlli.</p>
            </Surface>
          </div>
        </section>

        <section aria-labelledby="sc-overlays">
          <h2 id="sc-overlays" className="pc-section-title">
            Sheet, antd ed EmptyState
          </h2>
          <div className="sc-row sc-row--actions">
            <Button type="primary" size="large" onClick={() => setSheetOpen(true)}>
              Apri il pannello
            </Button>
            <Button size="large" onClick={() => setModalOpen(true)}>
              Apri finestra antd
            </Button>
            <Button size="large" onClick={() => message.success('Messaggio inviato')}>
              Mostra avviso
            </Button>
            <Switch defaultChecked aria-label="Interruttore di prova" />
          </div>
          <Surface padding={0}>
            <EmptyState
              icon="💬"
              title="Nessuna chat"
              description="Quando qualcuno ti scrive, la conversazione appare qui."
              action={
                <Button type="primary" size="large">
                  Scrivi a qualcuno
                </Button>
              }
            />
          </Surface>
        </section>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Frasi veloci"
        footer={
          <Button type="primary" size="large" block onClick={() => setSheetOpen(false)}>
            Fatto
          </Button>
        }
      >
        <div className="sc-tiles">
          {TILES.slice(0, 6).map((p) => (
            <PictoTile key={p.id} pictogram={p} size="sm" onPress={() => message.info(p.word)} />
          ))}
        </div>
        <p className="sc-hint">Trascina in basso, tocca fuori o premi Esc per chiudere.</p>
      </Sheet>

      <Modal title="Finestra antd" open={modalOpen} onOk={() => setModalOpen(false)} onCancel={() => setModalOpen(false)}>
        <p>I componenti antd seguono tema, colore, dimensione del testo e dei pulsanti.</p>
      </Modal>
    </PageScaffold>
  );
}

function pickLook(d: Settings): Partial<Settings> {
  const { fontScale, uppercase, letterSpacing, lineHeight, touchSize, boldText, pictogramSize, pictogramLabel, categoryColors, dyslexicFont, accentColor, glassIntensity, reduceMotion, reduceTransparency } = d;
  return { fontScale, uppercase, letterSpacing, lineHeight, touchSize, boldText, pictogramSize, pictogramLabel, categoryColors, dyslexicFont, accentColor, glassIntensity, reduceMotion, reduceTransparency };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sc-field">
      <span className="sc-field__label">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sc-toggle">
      <span>{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </label>
  );
}

export default Showcase;
