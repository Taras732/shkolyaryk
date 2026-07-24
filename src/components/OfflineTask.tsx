import { Printer, Clock, Users, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { describeOfflineTask } from '../school/offline-core';
import type { DailyPlanItemStatus, OfflineTask } from '../school/types';

interface OfflineTaskProps {
  task: OfflineTask;
  /** Статус кроку плану дня (DailyPlanItem.status). 'skipped' рендериться як неактивний, як 'done'. */
  status: DailyPlanItemStatus;
  onDone: () => void;
}

const ADULT_HELP_LABEL: Record<'none' | 'light' | 'required', string> = {
  none: 'Дитина робить сама',
  light: 'Дорослий поруч підстраховує',
  required: 'Потрібна допомога дорослого',
};

/** Картка офлайн-завдання (workbook/worksheet/activity) у «Мій день». */
export default function OfflineTaskCard({ task, status, onDone }: OfflineTaskProps) {
  const view = describeOfflineTask(task);
  const isDone = status !== 'pending';

  return (
    <div className="g-card" style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 34, lineHeight: 1 }}>{view.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="g-title" style={{ fontSize: 17, color: 'var(--c-ink)' }}>{task.title}</div>
          {view.summary && (
            <div style={{ color: 'var(--c-mut)', fontWeight: 600, fontSize: 13, marginTop: 2 }}>{view.summary}</div>
          )}
        </div>
        {isDone && (
          <span
            style={{
              flexShrink: 0,
              background: 'var(--c-green)',
              color: 'var(--text-light)',
              fontWeight: 800,
              fontSize: 12,
              borderRadius: 999,
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2} />
            Зроблено
          </span>
        )}
      </div>

      {view.instruction && (
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-ink)', marginBottom: 12, lineHeight: 1.5 }}>
          {view.instruction}
        </p>
      )}

      {view.materials.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 4 }}>Потрібно:</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: 'var(--c-ink)', lineHeight: 1.5 }}>
            {view.materials.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {view.steps.length > 0 && (
        <ol style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: 13.5, color: 'var(--c-ink)', lineHeight: 1.6 }}>
          {view.steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{s}</li>
          ))}
        </ol>
      )}

      {view.printUrl && (
        <a
          href={view.printUrl}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', marginBottom: 12 }}
        >
          <Printer size={15} strokeWidth={2} />
          Відкрити для друку
        </a>
      )}

      {(view.estimatedMinutes != null || view.adultHelp) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {view.estimatedMinutes != null && (
            <span className="g-diffbadge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} strokeWidth={2} />
              ~{view.estimatedMinutes} хв
            </span>
          )}
          {view.adultHelp && (
            <span className="g-diffbadge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} strokeWidth={2} />
              {ADULT_HELP_LABEL[view.adultHelp]}
            </span>
          )}
        </div>
      )}

      {view.safetyNote && (
        <div
          style={{
            background: '#FFF7E6',
            border: '1px solid #FCEFC7',
            borderRadius: 12,
            padding: '8px 12px',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#8A5A00',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
          {view.safetyNote}
        </div>
      )}

      <button
        className={`g-btn ${isDone ? 'soft' : 'primary'}`}
        disabled={isDone}
        onClick={onDone}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <CheckCircle2 size={16} strokeWidth={2} />
        {isDone ? 'Зроблено' : 'Зробив офлайн'}
      </button>

      {view.tip && (
        <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--c-mut)', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <Lightbulb size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
          {view.tip}
        </p>
      )}
    </div>
  );
}
