import { useId } from 'react';
import { Button } from 'antd';
import { DeleteOutlined, EditOutlined, SendOutlined, SoundOutlined } from '@ant-design/icons';
import type { PersonalPictogram } from '@/core/types';
import { PictoTile, Sheet, type StyleWithVars } from '@/components/ui';
import { personalToPictogram, speak, categoryById } from '@/services/aac';
import type { PictogramGroup } from '../lib/model';

function Group({ group, onSelect }: { group: PictogramGroup; onSelect: (p: PersonalPictogram) => void }) {
  const id = useId();
  const byId = new Map(group.items.map((p) => [p.id, p]));
  return (
    <section className="pg-group" aria-labelledby={id} style={{ '--cat': `var(--cat-${group.category.color})` } as StyleWithVars}>
      <h2 id={id} className="pg-group__title">
        <span aria-hidden="true">{group.category.icon}</span> {group.category.label}
        <span className="pg-group__count">{group.items.length}</span>
      </h2>
      <ul className="pg-grid" aria-labelledby={id}>
        {group.items.map((p) => (
          <li key={p.id}>
            <PictoTile
              pictogram={personalToPictogram(p)}
              onPress={(pic) => onSelect(byId.get(pic.id)!)}
              onLongPress={(pic) => onSelect(byId.get(pic.id)!)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Personal pictograms grouped by category. Tapping one opens its actions. */
export function PersonalSections({ groups, onSelect }: { groups: PictogramGroup[]; onSelect: (p: PersonalPictogram) => void }) {
  return (
    <div className="pg-stack">
      {groups.map((g) => (
        <Group key={g.category.id} group={g} onSelect={onSelect} />
      ))}
    </div>
  );
}

/** What you can do with one personal pictogram. */
export function PictogramActionsSheet({
  pictogram,
  onClose,
  onEdit,
  onSend,
  onDelete,
  canSend,
}: {
  pictogram: PersonalPictogram | null;
  onClose: () => void;
  onEdit: (p: PersonalPictogram) => void;
  onSend: (p: PersonalPictogram) => void;
  onDelete: (p: PersonalPictogram) => void;
  canSend: boolean;
}) {
  const category = pictogram ? categoryById(pictogram.category) : undefined;
  return (
    <Sheet open={!!pictogram} onClose={onClose} title={pictogram?.word}>
      {pictogram && (
        <div className="pg-actions">
          <div className="pg-actions__tile">
            <PictoTile pictogram={personalToPictogram(pictogram)} size="xl" onPress={() => void speak(pictogram.word)} />
            {category && (
              <span className="pg-hint">
                <span aria-hidden="true">{category.icon}</span> {category.label}
              </span>
            )}
          </div>
          <Button size="large" block icon={<SoundOutlined />} onClick={() => void speak(pictogram.word)}>
            Ascolta
          </Button>
          {canSend && (
            <Button type="primary" size="large" block icon={<SendOutlined />} onClick={() => onSend(pictogram)}>
              Invia a una chat
            </Button>
          )}
          <Button size="large" block icon={<EditOutlined />} onClick={() => onEdit(pictogram)}>
            Modifica
          </Button>
          <Button danger size="large" block icon={<DeleteOutlined />} onClick={() => onDelete(pictogram)}>
            Elimina
          </Button>
        </div>
      )}
    </Sheet>
  );
}
