import type { Settings } from '@/core/types';
import { useSettings } from '@/stores/settings';
import { ChoiceRow, SettingsGroup, ToggleRow } from '../components/controls';
import { LivePreview } from '../components/LivePreview';
import { QuickPhrasesEditor } from './QuickPhrasesEditor';

export function ChatSettingsSection() {
  const s = useSettings();
  return (
    <>
      <SettingsGroup title="Scrivere">
        <ChoiceRow<Settings['composerMode']>
          label="Come scrivere"
          description="Cosa si apre per primo in una chat. Si può sempre cambiare dalla chat."
          value={s.composerMode}
          onChange={(v) => s.set('composerMode', v)}
          stacked
          options={[
            { value: 'pictograms', label: 'Pittogrammi', icon: <span aria-hidden="true">🖼️</span> },
            { value: 'keyboard', label: 'Tastiera', icon: <span aria-hidden="true">⌨️</span> },
          ]}
        />
        <ToggleRow
          label="Risposte suggerite"
          description="Sopra la tastiera compaiono risposte pronte al messaggio ricevuto."
          checked={s.showSuggestions}
          onChange={(v) => s.set('showSuggestions', v)}
        />
        <ToggleRow
          label="Chiedi prima di inviare"
          description="Prima di inviare compare «Vuoi inviare?», per evitare invii per sbaglio."
          checked={s.confirmBeforeSend}
          onChange={(v) => s.set('confirmBeforeSend', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Messaggi">
        <ToggleRow
          label="Ora dei messaggi"
          description="Mostra a che ora è stato inviato ogni messaggio."
          checked={s.showTimestamps}
          onChange={(v) => s.set('showTimestamps', v)}
        />
        <LivePreview />
      </SettingsGroup>

      <SettingsGroup title="Frasi veloci" description="Frasi pronte da inviare con un tocco. Le trovi nella chat.">
        <QuickPhrasesEditor />
      </SettingsGroup>
    </>
  );
}
