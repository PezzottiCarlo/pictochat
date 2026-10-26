import { useRef, useState } from 'react';
import { App, Button } from 'antd';
import { DownloadOutlined, UndoOutlined, UploadOutlined } from '@ant-design/icons';
import { Sheet } from '@/components/ui';
import { usePersonalPictograms, usePersonalStore } from '@/services/aac';
import { DEFAULT_SETTINGS, ROLE_PRESETS, getSettings, useSettings } from '@/stores/settings';
import { BackupError, backupFileName, buildBackup, parseBackup, type RestoredBackup } from '../lib/backup';
import { Note, Row, SettingsGroup } from '../components/controls';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const formatDate = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'data sconosciuta';
};

export function BackupSection() {
  const { modal, message } = App.useApp();
  const { items } = usePersonalPictograms();
  const patch = useSettings((s) => s.patch);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [pending, setPending] = useState<RestoredBackup | null>(null);

  const exportBackup = async () => {
    setBusy('export');
    try {
      await usePersonalStore.getState().init();
      const file = await buildBackup(getSettings(), usePersonalStore.getState().items);
      download(new Blob([JSON.stringify(file)], { type: 'application/json' }), backupFileName());
      void message.success('Backup salvato nei download');
    } catch {
      void message.error('Non sono riuscito a creare il backup. Riprova.');
    } finally {
      setBusy(null);
    }
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (err) {
      void message.error(err instanceof BackupError ? err.message : 'Non riesco a leggere il file.');
    }
  };

  const restore = async (backup: RestoredBackup) => {
    setBusy('import');
    try {
      patch(backup.settings);
      const { add } = usePersonalStore.getState();
      for (const p of backup.pictograms) {
        await add({ word: p.word, category: p.category, image: p.image, origin: p.origin });
      }
      setPending(null);
      void message.success('Backup ripristinato');
    } catch {
      void message.error('Il ripristino si è fermato a metà. Riprova.');
    } finally {
      setBusy(null);
    }
  };

  const resetDefaults = () =>
    modal.confirm({
      title: 'Tornare alle impostazioni iniziali?',
      content:
        'Aspetto, lettura, pittogrammi, voce e frasi veloci tornano come all’inizio. Restano il ruolo, il PIN e i pittogrammi personali.',
      okText: 'Sì, torna all’inizio',
      okButtonProps: { danger: true },
      cancelText: 'No',
      onOk: () => {
        const { role, settingsPinHash, onboardingDone } = getSettings();
        patch({ ...DEFAULT_SETTINGS, ...ROLE_PRESETS[role], role, settingsPinHash, onboardingDone });
        void message.success('Impostazioni iniziali ripristinate');
      },
    });

  const settingsCount = pending ? Object.keys(pending.settings).length : 0;

  return (
    <>
      <SettingsGroup
        title="Salva un backup"
        description="Un file con tutte le impostazioni e le tue foto dei pittogrammi. Ti serve per un telefono nuovo."
      >
        <Row>
          <Button type="primary" size="large" block icon={<DownloadOutlined />} loading={busy === 'export'} onClick={() => void exportBackup()}>
            Salva il backup
          </Button>
          <Note>
            Contiene {items.length === 1 ? '1 pittogramma personale' : `${items.length} pittogrammi personali`}. Il PIN non viene
            salvato nel file.
          </Note>
        </Row>
      </SettingsGroup>

      <SettingsGroup title="Ripristina un backup" description="Scegli un file di backup di PictoChat.">
        <Row>
          <Button size="large" block icon={<UploadOutlined />} loading={busy === 'import'} onClick={() => fileRef.current?.click()}>
            Scegli il file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void readFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </Row>
      </SettingsGroup>

      <SettingsGroup title="Impostazioni iniziali">
        <Row>
          <Button danger size="large" block icon={<UndoOutlined />} onClick={resetDefaults}>
            Torna alle impostazioni iniziali
          </Button>
        </Row>
      </SettingsGroup>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Ripristinare questo backup?"
        dismissible={busy !== 'import'}
        footer={
          pending && (
            <div className="st-actions">
              <Button type="primary" size="large" block loading={busy === 'import'} onClick={() => void restore(pending)}>
                Ripristina
              </Button>
              <Button size="large" block disabled={busy === 'import'} onClick={() => setPending(null)}>
                Annulla
              </Button>
            </div>
          )
        }
      >
        {pending && (
          <ul className="st-summary">
            <li>Salvato il {formatDate(pending.exportedAt)}</li>
            <li>{settingsCount} impostazioni</li>
            <li>
              {pending.pictograms.length === 1 ? '1 pittogramma personale' : `${pending.pictograms.length} pittogrammi personali`}
              {pending.skipped > 0 && ` (${pending.skipped} rovinati, li salto)`}
            </li>
            <li>I pittogrammi con la stessa parola vengono sostituiti.</li>
          </ul>
        )}
      </Sheet>
    </>
  );
}
