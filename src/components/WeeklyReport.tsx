import { TrendingUp } from 'lucide-react';
import type { WeeklyReport as WeeklyReportType } from '@/school/report-core';

interface Props {
  report: WeeklyReportType;
}

export default function WeeklyReport({ report }: Props) {
  const maxCount = Math.max(...report.perDay.map((d) => d.count), 1); // мінімум 1, щоб бар був видимий

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Заголовок */}
      <div className="font-display" style={{ fontSize: '11px', color: 'var(--text-dark)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TrendingUp size={14} strokeWidth={2} />
        ПРОГРЕС ЗА ТИЖДЕНЬ
      </div>

      {/* Активні дні */}
      <div
        className="card-clay"
        style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)' }}>Активні дні</div>
        <div className="font-display" style={{ fontSize: '18px', color: 'var(--primary)' }}>
          {report.activeDays}/7
        </div>
      </div>

      {/* Кількість ігор та точність */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card-clay" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Ігор</div>
          <div className="font-display" style={{ fontSize: '20px', color: 'var(--primary)', marginTop: '4px' }}>
            {report.totalGames}
          </div>
        </div>

        <div className="card-clay" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Точність</div>
          <div className="font-display" style={{ fontSize: '20px', color: 'var(--success)', marginTop: '4px' }}>
            {report.accuracyPct}%
          </div>
        </div>
      </div>

      {/* Новий мастерій та топ предмет */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card-clay" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Засвоєно</div>
          <div className="font-display" style={{ fontSize: '20px', color: 'var(--primary)', marginTop: '4px' }}>
            {report.newlyMastered}
          </div>
        </div>

        <div className="card-clay" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Топ предмет
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)' }}>
            {report.topSubject || '—'}
          </div>
        </div>
      </div>

      {/* Per-day бар */}
      <div className="card-clay" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>
          Активність за днями
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px' }}>
          {report.perDay.map((day, idx) => {
            const heightPct = day.count === 0 ? 0 : Math.max((day.count / maxCount) * 100, 10); // мінімум 10% для видимості
            return (
              <div
                key={idx}
                title={`${day.date}: ${day.count} ${day.count === 1 ? 'гра' : 'ігор'}`}
                style={{
                  flex: 1,
                  height: `${heightPct}%`,
                  background: day.count === 0 ? 'var(--surface-soft)' : 'var(--success)',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>{report.perDay[0].date}</span>
          <span>{report.perDay[6].date}</span>
        </div>
      </div>
    </div>
  );
}
