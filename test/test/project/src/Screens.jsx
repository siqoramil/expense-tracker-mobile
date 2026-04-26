// Remaining screens — stats, debtors, debtor detail, all-tx, notifications, budgets, categories, wallets, calendar, reports, settings subs, profile, tx detail
const { useState: uS, useEffect: uE, useMemo: uM } = React;

// ── Statistics ──────────────────────────────────
const StatsScreen = ({ t }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const months = last6Months();
  const data = months.map(m => {
    const md = selectMonth(s, m.key);
    return { m: m.label, income: md.income, expense: md.expense };
  });
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const totalInc = data.reduce((a, d) => a + d.income, 0);
  const totalExp = data.reduce((a, d) => a + d.expense, 0);

  const catBreakdown = uM(() => {
    const curMo = months[months.length - 1].key;
    const map = {};
    s.tx.filter(x => x.kind === 'expense' && x.date.startsWith(curMo)).forEach(x => {
      map[x.cat] = (map[x.cat] || 0) + x.amount;
    });
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount);
  }, [s.tx]);

  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'statistics')} subtitle="Last 6 months" />

      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 10 }}>
        <SumCard t={t} label={lang === 'uz' ? 'Jami kirim' : 'Total Income'} amount={totalInc} kind="income" />
        <SumCard t={t} label={lang === 'uz' ? 'Jami chiqim' : 'Total Expenses'} amount={totalExp} kind="expense" />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Card t={t} style={{ padding: '18px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{lang === 'uz' ? 'Kirim va chiqim' : 'Income vs Expenses'}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: t.textSec, fontWeight: 500 }}>
              <LegendDot color={t.income} label={tStr(lang, 'income')} />
              <LegendDot color={t.expense} label={tStr(lang, 'expenses')} />
            </div>
          </div>
          <BarChart data={data} max={maxVal} t={t} lang={lang} />
        </Card>
      </div>

      <SectionHeader t={t} title={lang === 'uz' ? 'Eng ko\u2018p toifalar' : 'Top categories'} />
      <div style={{ padding: '0 20px' }}>
        {catBreakdown.length === 0 ? (
          <Card t={t}><EmptyState icon="chart" title={tStr(lang, 'noTransactions')} t={t} /></Card>
        ) : (
          <Card t={t} style={{ padding: '12px 16px' }}>
            {catBreakdown.map((row, i, arr) => {
              const c = s.categories.find(x => x.id === row.cat);
              const pct = Math.min(100, (row.amount / catBreakdown[0].amount) * 100);
              return (
                <div key={row.cat} style={{ padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.divider}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <CatIcon cat={row.cat} size={30} />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: t.text }}>{catLabel(c, lang)}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text, fontFeatureSettings: '"tnum"' }}>
                      {fmtMoney(row.amount, s.prefs.currency)}
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: t.surfaceAlt, overflow: 'hidden', marginLeft: 40 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c?.color || t.accent, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
    <span>{label}</span>
  </div>
);

const SumCard = ({ label, amount, kind, t }) => {
  const up = kind === 'income';
  const color = up ? t.income : t.expense;
  return (
    <div style={{ flex: 1, padding: '13px 13px 11px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: up ? t.incomeSoft : t.expenseSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={up ? 'arrow-down-left' : 'arrow-up-right'} size={12} color={color} stroke={2.5} />
        </div>
        <div style={{ fontSize: 12, color: t.textSec, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: -0.4, fontFeatureSettings: '"tnum"' }}>{fmtMoney(amount, store.get().prefs.currency)}</div>
    </div>
  );
};

const BarChart = ({ data, max, t, lang }) => {
  const H = 150; const barW = 11; const gap = 3;
  return (
    <div>
      <div style={{ height: H, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, paddingBottom: 8, borderBottom: `1px dashed ${t.divider}` }}>
        {data.map((d, i) => {
          const incH = (d.income / max) * (H - 16);
          const expH = (d.expense / max) * (H - 16);
          const isLast = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap, position: 'relative' }}>
              <div style={{ width: barW, height: incH, borderRadius: '4px 4px 2px 2px', background: t.income, opacity: isLast ? 1 : 0.85 }} />
              <div style={{ width: barW, height: expH, borderRadius: '4px 4px 2px 2px', background: t.expense, opacity: isLast ? 1 : 0.85 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 500, color: i === data.length - 1 ? t.text : t.textSec }}>{d.m}</div>
        ))}
      </div>
    </div>
  );
};

// ── Debtors ─────────────────────────────────────
const DebtorsScreen = ({ t, onOpen, onAdd, onNav }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [dir, setDir] = uS('owe_me');
  const [q, setQ] = uS('');
  const [filter, setFilter] = uS('all');

  const filtered = s.debts.filter(d => {
    if (d.archived) return false;
    if (d.direction !== dir) return false;
    if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
    const overdue = new Date(d.due) < today() && d.paid < d.amount;
    if (filter === 'overdue' && !overdue) return false;
    if (filter === 'due' && !(new Date(d.due) - today() < 7 * 86400000 && !overdue)) return false;
    return true;
  });

  const total = filtered.reduce((a, d) => a + (d.amount - d.paid), 0);
  const overdueN = s.debts.filter(d => !d.archived && d.direction === dir && new Date(d.due) < today() && d.paid < d.amount).length;
  const dueWk = s.debts.filter(d => !d.archived && d.direction === dir && new Date(d.due) - today() < 7 * 86400000 && new Date(d.due) >= today() && d.paid < d.amount).length;

  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'debtors')} subtitle={`${filtered.length} ${lang === 'uz' ? 'yozuv' : 'records'}`}
        trailing={<Press onClick={onAdd} style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${t.accent}33` }}><Icon name="plus" size={18} color="#fff" stroke={2.5} /></Press>} />

      <div style={{ padding: '0 20px 14px' }}>
        <SegmentedControl t={t} value={dir} onChange={setDir}
          options={[
            { k: 'owe_me', label: tStr(lang, 'oweMe') },
            { k: 'i_owe',  label: tStr(lang, 'iOwe') },
          ]} />
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <Card t={t} style={{ padding: '20px 22px 16px', background: dir === 'owe_me' ? t.accent : t.expense, borderColor: 'transparent', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>
            {dir === 'owe_me' ? tStr(lang, 'totalOwedYou') : tStr(lang, 'totalYouOwe')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: -1, fontFeatureSettings: '"tnum"' }}>{fmtMoney(total, s.prefs.currency)}</div>
            {s.prefs.currency === 'UZS' && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>so'm</div>}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', gap: 18 }}>
            <MiniS label={tStr(lang, 'active')} value={filtered.length} />
            <MiniS label={tStr(lang, 'overdue')} value={overdueN} />
            <MiniS label={tStr(lang, 'dueThisWeek')} value={dueWk} />
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 20px 10px' }}>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={16} color={t.textTer} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={lang === 'uz' ? 'Ism bo\u2018yicha qidirish\u2026' : 'Search name...'} style={{
            width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12,
            background: t.surface, border: `1px solid ${t.border}`,
            color: t.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }} />
        </div>
      </div>

      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[['all','All'],['due','Due soon'],['overdue','Overdue']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '6px 12px', borderRadius: 100,
            background: filter === k ? t.text : t.surface,
            color: filter === k ? t.surface : t.text,
            border: `1px solid ${filter === k ? t.text : t.border}`,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <Card t={t}><EmptyState icon="users" title={tStr(lang, 'noDebtors')} subtitle={tStr(lang, 'noDebtorsSub')} t={t} /></Card>
        ) : filtered.map(d => (<DebtorCard key={d.id} debtor={d} t={t} lang={lang} onClick={() => onOpen(d)} currency={s.prefs.currency} />))}
      </div>
    </div>
  );
};

const MiniS = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFeatureSettings: '"tnum"' }}>{value}</div>
    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontWeight: 500 }}>{label}</div>
  </div>
);

const DebtorCard = ({ debtor, t, lang, onClick, currency }) => {
  const overdue = new Date(debtor.due) < today() && debtor.paid < debtor.amount;
  const remaining = debtor.amount - debtor.paid;
  const initials = debtor.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button onClick={onClick} style={{
      padding: '14px 16px', borderRadius: 16,
      background: t.surface, border: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 21, background: debtor.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: debtor.color }}>{initials}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{debtor.name}</div>
          {overdue && <div style={{ fontSize: 9.5, fontWeight: 700, color: t.expense, background: t.expenseSoft, padding: '2px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{tStr(lang, 'overdue')}</div>}
        </div>
        <div style={{ fontSize: 12, color: t.textSec, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{debtor.note}</div>
        <div style={{ fontSize: 11, color: t.textTer, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Icon name="calendar" size={10} color={t.textTer} stroke={2} />
          {fmtDate(debtor.due, lang)}
          {debtor.paid > 0 && <span style={{ color: t.income, marginLeft: 6 }}>· {fmtMoney(debtor.paid, currency)} {tStr(lang, 'paid').toLowerCase()}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFeatureSettings: '"tnum"' }}>{fmtMoney(remaining, currency)}</div>
        <div style={{ fontSize: 10, color: t.textSec, marginTop: 2 }}>{currency === 'UZS' ? "so'm" : ''}</div>
      </div>
    </button>
  );
};

// Debtor detail + payments
const DebtorDetail = ({ t, debtor, onBack }) => {
  const s = useStore();
  const d = s.debts.find(x => x.id === debtor.id) || debtor;
  const lang = s.prefs.lang;
  const [payOpen, setPayOpen] = uS(false);
  const [payAmt, setPayAmt] = uS('');
  const remaining = d.amount - d.paid;
  const pct = Math.min(100, (d.paid / d.amount) * 100);
  const initials = d.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

  const addPay = () => {
    const n = Number(payAmt) || 0;
    if (n <= 0) return;
    actions.addPayment(d.id, Math.min(n, remaining));
    setPayAmt(''); setPayOpen(false);
    window.toast?.(tStr(lang, 'saved'));
  };

  const markPaid = () => {
    actions.archiveDebt(d.id);
    window.toast?.(tStr(lang, 'paidOff'));
    onBack();
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={d.name} subtitle={d.direction === 'owe_me' ? tStr(lang, 'oweMe') : tStr(lang, 'iOwe')} onBack={onBack} />

      <div style={{ padding: '0 20px 18px' }}>
        <Card t={t} style={{ padding: '20px', background: d.color, borderColor: 'transparent', textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{initials}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: 0.3, marginBottom: 4 }}>{tStr(lang, 'remaining').toUpperCase()}</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, fontFeatureSettings: '"tnum"' }}>{fmtMoney(remaining, s.prefs.currency)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{tStr(lang, 'paid')} {fmtMoney(d.paid, s.prefs.currency)} / {fmtMoney(d.amount, s.prefs.currency)}</div>
          <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: '#fff', borderRadius: 3 }} />
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 20px 18px', display: 'flex', gap: 10 }}>
        <button onClick={() => setPayOpen(true)} style={{
          flex: 1, padding: '13px', borderRadius: 14, background: t.accent, color: '#fff',
          border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>{tStr(lang, 'addPayment')}</button>
        <button onClick={markPaid} style={{
          flex: 1, padding: '13px', borderRadius: 14, background: t.surface, color: t.text,
          border: `1px solid ${t.border}`, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>{tStr(lang, 'markPaid')}</button>
      </div>

      <SectionHeader t={t} title={tStr(lang, 'payments')} />
      <div style={{ padding: '0 20px 20px' }}>
        {d.payments && d.payments.length > 0 ? (
          <Card t={t} style={{ padding: '8px 16px' }}>
            {d.payments.map((p, i, arr) => (
              <div key={p.id} style={{ padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: t.incomeSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={14} color={t.income} stroke={3} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>{tStr(lang, 'addPayment')}</div>
                  <div style={{ fontSize: 11.5, color: t.textSec }}>{fmtDate(p.date, lang)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.income, fontFeatureSettings: '"tnum"' }}>+{fmtMoney(p.amount, s.prefs.currency)}</div>
              </div>
            ))}
          </Card>
        ) : (
          <Card t={t}><EmptyState icon="check" title={lang === 'uz' ? 'Hali to\u2018lovlar yo\u2018q' : 'No payments yet'} t={t} /></Card>
        )}
      </div>

      <SectionHeader t={t} title={tStr(lang, 'note')} />
      <div style={{ padding: '0 20px' }}>
        <Card t={t} style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13.5, color: t.text }}>{d.note || '—'}</div>
          <div style={{ fontSize: 11.5, color: t.textSec, marginTop: 6 }}>{lang === 'uz' ? 'Boshlangan' : 'Created'}: {fmtDate(d.created, lang)} · {lang === 'uz' ? 'Muddati' : 'Due'}: {fmtDate(d.due, lang)}</div>
        </Card>
      </div>

      {payOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setPayOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: t.sheetBg, borderRadius: '28px 28px 0 0', padding: '20px 20px 34px' }}>
            <div style={{ width: 38, height: 5, borderRadius: 3, background: t.borderStrong, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 16 }}>{tStr(lang, 'addPayment')}</div>
            <input autoFocus type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="0" style={{
              width: '100%', padding: '16px', borderRadius: 14, background: t.surfaceAlt, border: `1px solid ${t.border}`,
              color: t.text, fontSize: 24, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }} />
            <div style={{ fontSize: 12, color: t.textSec, textAlign: 'center', marginTop: 6 }}>Max: {fmtMoney(remaining, s.prefs.currency)}</div>
            <button onClick={addPay} style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, background: t.accent, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{tStr(lang, 'save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── All transactions ────────────────────────────
const AllTxScreen = ({ t, onBack, onOpenTx }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [q, setQ] = uS('');
  const [filter, setFilter] = uS('all'); // all | income | expense

  const filtered = s.tx.filter(x => {
    if (filter !== 'all' && x.kind !== filter) return false;
    if (q) {
      const cat = s.categories.find(c => c.id === x.cat);
      const hay = (x.note + ' ' + catLabel(cat, lang)).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  // Group by date
  const groups = {};
  filtered.forEach(x => { (groups[x.date] = groups[x.date] || []).push(x); });
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'allTransactions')} onBack={onBack} />

      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Icon name="search" size={16} color={t.textTer} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tStr(lang, 'searchPlaceholder')} style={{
            width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12,
            background: t.surface, border: `1px solid ${t.border}`,
            color: t.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }} />
        </div>
        <SegmentedControl t={t} value={filter} onChange={setFilter}
          options={[
            { k: 'all',     label: 'All' },
            { k: 'income',  label: tStr(lang, 'income') },
            { k: 'expense', label: tStr(lang, 'expenses') },
          ]} />
      </div>

      <div style={{ padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <Card t={t}><EmptyState icon="wallet" title={tStr(lang, 'noTransactions')} subtitle={tStr(lang, 'noTransactionsSub')} t={t} /></Card>
        ) : sortedDates.map(date => (
          <div key={date} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: t.textSec, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>{fmtDate(date, lang).toUpperCase()}</div>
            <Card t={t} style={{ padding: '4px 16px' }}>
              {groups[date].map((tx, i, arr) => (
                <TxRow key={tx.id} tx={tx} t={t} last={i === arr.length - 1}
                  onTap={() => onOpenTx(tx)}
                  onDelete={() => { actions.deleteTx(tx.id); window.toast?.(tStr(lang, 'deleted')); }} />
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Notifications ───────────────────────────────
const NotificationsScreen = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const ICONS = { overdue: ['close', t.expense], budget: ['chart', '#F59E0B'], bill: ['calendar', t.accent], income: ['arrow-down-left', t.income] };
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'notifications')} onBack={onBack}
        trailing={s.notifs.length > 0 && (
          <button onClick={() => actions.markAllNotifsRead()} style={{ background: 'none', border: 'none', color: t.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {lang === 'uz' ? 'Hammasi o\u2018qildi' : 'Mark all read'}
          </button>
        )} />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {s.notifs.length === 0 ? (
          <Card t={t}><EmptyState icon="bell" title={lang === 'uz' ? 'Bildirishnomalar yo\u2018q' : 'No notifications'} t={t} /></Card>
        ) : s.notifs.map(n => {
          const [icon, color] = ICONS[n.kind] || ['bell', t.accent];
          return (
            <Card key={n.id} t={t} onClick={() => actions.markNotifRead(n.id)} style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: n.read ? t.surface : t.accentSoft }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={icon} size={17} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{n.title[lang] || n.title.en}</div>
                <div style={{ fontSize: 12.5, color: t.textSec, marginTop: 3 }}>{n.body[lang] || n.body.en}</div>
                <div style={{ fontSize: 11, color: t.textTer, marginTop: 4 }}>{fmtDate(n.date, lang)}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: 4, background: t.accent, marginTop: 6 }} />}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ── Budgets ─────────────────────────────────────
const BudgetsScreen = ({ t, onBack, onAdd }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const curMo = last6Months().slice(-1)[0].key;
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'budgets')} onBack={onBack}
        trailing={<Press onClick={onAdd} style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={18} color="#fff" stroke={2.5} /></Press>} />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {s.budgets.length === 0 ? (
          <Card t={t}><EmptyState icon="chart" title={lang === 'uz' ? 'Byudjetlar yo\u2018q' : 'No budgets'} t={t} /></Card>
        ) : s.budgets.map(b => {
          const cat = s.categories.find(c => c.id === b.cat);
          const spent = s.tx.filter(x => x.cat === b.cat && x.kind === 'expense' && x.date.startsWith(curMo)).reduce((a, x) => a + x.amount, 0);
          const pct = Math.min(100, (spent / b.limit) * 100);
          const over = spent > b.limit;
          return (
            <Card key={b.id} t={t} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <CatIcon cat={b.cat} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{catLabel(cat, lang)}</div>
                  <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
                    {fmtMoney(spent, s.prefs.currency)} / {fmtMoney(b.limit, s.prefs.currency)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: over ? t.expense : t.text, fontFeatureSettings: '"tnum"' }}>
                  {Math.round(pct)}%
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: t.surfaceAlt, overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: over ? t.expense : (cat?.color || t.accent), borderRadius: 3, transition: 'width 300ms' }} />
              </div>
              <div style={{ fontSize: 11.5, color: t.textSec, marginTop: 6 }}>
                {over ? tStr(lang, 'overspent') + ' ' + fmtMoney(spent - b.limit, s.prefs.currency) : fmtMoney(b.limit - spent, s.prefs.currency) + ' ' + tStr(lang, 'left')}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ── Categories manager ──────────────────────────
const CategoriesScreen = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [addOpen, setAddOpen] = uS(false);
  const [newName, setNewName] = uS('');
  const [newKind, setNewKind] = uS('expense');
  const [newColor, setNewColor] = uS('#6366F1');
  const [newIcon, setNewIcon] = uS('tag');
  const COLORS = ['#F59E0B','#3B82F6','#EC4899','#8B5CF6','#06B6D4','#10B981','#EF4444','#F97316','#14B8A6','#6366F1'];
  const ICONS = ['coffee','car','cart','home-icon','phone','briefcase','gift','tag','wallet','trending-up'];

  const add = () => {
    if (!newName) return;
    actions.addCategory({ label: { en: newName, uz: newName }, kind: newKind, color: newColor, icon: newIcon });
    setNewName(''); setAddOpen(false); window.toast?.(tStr(lang, 'saved'));
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'categoriesLabel')} onBack={onBack}
        trailing={<Press onClick={() => setAddOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={18} color="#fff" stroke={2.5} /></Press>} />
      <div style={{ padding: '0 20px' }}>
        {['expense','income'].map(kind => (
          <div key={kind} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: t.textSec, fontWeight: 600, marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' }}>{tStr(lang, kind + '_s')}</div>
            <Card t={t} style={{ padding: '4px 16px' }}>
              {s.categories.filter(c => c.kind === kind).map((c, i, arr) => (
                <div key={c.id} style={{ padding: '11px 0', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.divider}` }}>
                  <CatIcon cat={c.id} size={34} />
                  <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: t.text }}>{catLabel(c, lang)}</div>
                  <button onClick={() => { actions.deleteCategory(c.id); window.toast?.(tStr(lang, 'deleted')); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                    <Icon name="close" size={16} color={t.textTer} />
                  </button>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      {addOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setAddOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: t.sheetBg, borderRadius: '28px 28px 0 0', padding: '20px 20px 34px', maxHeight: '85%', overflowY: 'auto' }}>
            <div style={{ width: 38, height: 5, borderRadius: 3, background: t.borderStrong, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 14 }}>{tStr(lang, 'newCategory')}</div>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder={tStr(lang, 'name')} style={inputStyle(t)} />
            <div style={{ marginTop: 10 }}>
              <SegmentedControl t={t} value={newKind} onChange={setNewKind} options={[
                { k: 'expense', label: tStr(lang, 'expense_s') },
                { k: 'income',  label: tStr(lang, 'income_s') },
              ]} />
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 600, color: t.textSec, letterSpacing: 0.3 }}>{tStr(lang, 'color').toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{ width: 30, height: 30, borderRadius: 15, background: c, border: newColor === c ? '3px solid ' + t.text : '3px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 600, color: t.textSec, letterSpacing: 0.3 }}>{tStr(lang, 'icon').toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 6 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setNewIcon(ic)} style={{ padding: 10, borderRadius: 10, background: newIcon === ic ? newColor + '22' : t.surfaceAlt, border: newIcon === ic ? `1.5px solid ${newColor}` : '1.5px solid transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                  <Icon name={ic} size={18} color={newColor} />
                </button>
              ))}
            </div>
            <button onClick={add} style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, background: t.accent, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{tStr(lang, 'save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Wallets screen ──────────────────────────────
const WalletsScreen = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const total = s.wallets.reduce((a, w) => a + w.balance, 0);
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'wallets')} onBack={onBack} subtitle={`${fmtMoney(total, s.prefs.currency)} ${s.prefs.currency === 'UZS' ? "so'm" : ''}`} />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {s.wallets.map(w => (
          <Card key={w.id} t={t} style={{ padding: '18px 18px', background: w.color, borderColor: 'transparent', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={w.icon} size={18} color="#fff" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{walletName(w, lang)}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.8, fontFeatureSettings: '"tnum"' }}>{fmtMoney(w.balance, s.prefs.currency)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{s.prefs.currency === 'UZS' ? "so'm" : s.prefs.currency}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── Calendar ────────────────────────────────────
const CalendarScreen = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [cursor, setCursor] = uS(() => { const d = today(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = uS(isoDate(today()));

  const firstDay = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first

  const byDay = {};
  s.tx.forEach(x => {
    const d = new Date(x.date);
    if (d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
      (byDay[d.getDate()] = byDay[d.getDate()] || { inc: 0, exp: 0 });
      if (x.kind === 'income') byDay[d.getDate()].inc += x.amount; else byDay[d.getDate()].exp += x.amount;
    }
  });
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const selTx = s.tx.filter(x => x.date === selected);

  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'calendar')} onBack={onBack} />
      <div style={{ padding: '0 20px 14px' }}>
        <Card t={t} style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={() => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })} style={{ width: 30, height: 30, borderRadius: 15, background: t.surfaceAlt, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron-right" size={14} color={t.textSec} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{monthNames[cursor.m]} {cursor.y}</div>
            <button onClick={() => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })} style={{ width: 30, height: 30, borderRadius: 15, background: t.surfaceAlt, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron-right" size={14} color={t.textSec} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (<div key={i} style={{ textAlign: 'center', fontSize: 10, color: t.textTer, fontWeight: 600 }}>{d}</div>))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array(startOffset).fill(0).map((_, i) => <div key={'e' + i} />)}
            {Array(daysInMonth).fill(0).map((_, i) => {
              const d = i + 1;
              const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const info = byDay[d];
              const isSel = selected === iso;
              return (
                <button key={d} onClick={() => setSelected(iso)} style={{
                  aspectRatio: '1', borderRadius: 9,
                  background: isSel ? t.accent : (info ? t.accentSoft : 'transparent'),
                  border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: isSel ? '#fff' : t.text, fontSize: 12, fontWeight: isSel ? 700 : 500,
                }}>
                  {d}
                  {info && <div style={{ width: 4, height: 4, borderRadius: 2, background: isSel ? '#fff' : t.accent, marginTop: 2 }} />}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
      <SectionHeader t={t} title={fmtDate(selected, lang)} />
      <div style={{ padding: '0 20px' }}>
        {selTx.length === 0 ? <Card t={t}><EmptyState icon="calendar" title={tStr(lang, 'noTransactions')} t={t} /></Card>
         : <Card t={t} style={{ padding: '4px 16px' }}>{selTx.map((tx, i, arr) => <TxRow key={tx.id} tx={tx} t={t} last={i === arr.length - 1} onDelete={() => actions.deleteTx(tx.id)} />)}</Card>}
      </div>
    </div>
  );
};

// ── Reports ─────────────────────────────────────
const ReportsScreen = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const months = last6Months();
  const totalInc = months.reduce((a, m) => a + selectMonth(s, m.key).income, 0);
  const totalExp = months.reduce((a, m) => a + selectMonth(s, m.key).expense, 0);
  const handleExport = () => {
    const rows = [['Date','Kind','Category','Wallet','Amount','Note']];
    s.tx.forEach(x => rows.push([x.date, x.kind, x.cat, x.wallet, x.amount, x.note || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ledgr-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
    window.toast?.(lang === 'uz' ? 'Eksport qilindi' : 'Exported');
  };
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'reports')} onBack={onBack} />
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10 }}>
        <SumCard t={t} label={lang === 'uz' ? '6 oy kirim' : '6mo Income'} amount={totalInc} kind="income" />
        <SumCard t={t} label={lang === 'uz' ? '6 oy chiqim' : '6mo Expenses'} amount={totalExp} kind="expense" />
      </div>
      <div style={{ padding: '0 20px' }}>
        <Card t={t} onClick={handleExport} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0EA5E922', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="download" size={18} color="#0EA5E9" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{tStr(lang, 'exportData')} (CSV)</div>
            <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{s.tx.length} {lang === 'uz' ? 'amallar' : 'transactions'}</div>
          </div>
          <Icon name="chevron-right" size={16} color={t.textTer} />
        </Card>
      </div>
    </div>
  );
};

// ── Transaction Detail ──────────────────────────
const TxDetail = ({ t, tx, onBack, onEdit }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const cat = s.categories.find(c => c.id === tx.cat);
  const w = s.wallets.find(x => x.id === tx.wallet);
  const up = tx.kind === 'income';
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'transactionDetail')} onBack={onBack} />
      <div style={{ padding: '0 20px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: t.textSec, fontWeight: 600, letterSpacing: 0.3, marginBottom: 4 }}>{tStr(lang, (up ? 'income' : 'expenses')).toUpperCase()}</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: up ? t.income : t.expense, letterSpacing: -1.2, fontFeatureSettings: '"tnum"' }}>
          {(up ? '+' : '−') + fmtMoney(tx.amount, s.prefs.currency)}
        </div>
        <div style={{ fontSize: 13, color: t.textSec, marginTop: 2 }}>{s.prefs.currency === 'UZS' ? "so'm" : s.prefs.currency}</div>
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        <Card t={t} style={{ padding: '4px 16px' }}>
          <DetailRow t={t} label={tStr(lang, 'note')}     value={tx.note || '—'} />
          <DetailRow t={t} label={tStr(lang, 'category')} value={catLabel(cat, lang)} />
          <DetailRow t={t} label={tStr(lang, 'wallet')}   value={walletName(w, lang)} />
          <DetailRow t={t} label={tStr(lang, 'date')}     value={fmtDate(tx.date, lang)} last />
        </Card>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', gap: 10 }}>
        <button onClick={() => onEdit(tx)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: t.surface, color: t.text, border: `1px solid ${t.border}`, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          <Icon name="settings" size={14} color={t.text} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />{tStr(lang, 'edit')}
        </button>
        <button onClick={() => { actions.deleteTx(tx.id); window.toast?.(tStr(lang, 'deleted')); onBack(); }} style={{ flex: 1, padding: '14px', borderRadius: 14, background: t.expenseSoft, color: t.expense, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {tStr(lang, 'delete')}
        </button>
      </div>
    </div>
  );
};

const DetailRow = ({ t, label, value, last }) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '13px 0', borderBottom: last ? 'none' : `1px solid ${t.divider}` }}>
    <div style={{ fontSize: 13.5, color: t.textSec, flex: 1 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: t.text, textAlign: 'right' }}>{value}</div>
  </div>
);

// ── Settings subs (Language, Currency, Security) ──
const LanguageScreen = ({ t, onBack }) => {
  const s = useStore(); const lang = s.prefs.lang;
  const opts = [{ k: 'en', label: 'English' }, { k: 'uz', label: 'O\u2018zbekcha' }];
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'language')} onBack={onBack} />
      <div style={{ padding: '0 20px' }}>
        <Card t={t} style={{ padding: '4px 16px' }}>
          {opts.map((o, i) => (
            <div key={o.k} onClick={() => actions.setPref('lang', o.k)} style={{ padding: '14px 0', borderBottom: i === opts.length - 1 ? 'none' : `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: 500 }}>{o.label}</div>
              {lang === o.k && <Icon name="check" size={18} color={t.accent} stroke={3} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

const CurrencyScreen = ({ t, onBack }) => {
  const s = useStore(); const lang = s.prefs.lang;
  const opts = [{ k: 'UZS', label: 'UZS (so\u2018m)' }, { k: 'USD', label: 'USD ($)' }];
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'currency')} onBack={onBack} />
      <div style={{ padding: '0 20px' }}>
        <Card t={t} style={{ padding: '4px 16px' }}>
          {opts.map((o, i) => (
            <div key={o.k} onClick={() => actions.setPref('currency', o.k)} style={{ padding: '14px 0', borderBottom: i === opts.length - 1 ? 'none' : `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: 500 }}>{o.label}</div>
              {s.prefs.currency === o.k && <Icon name="check" size={18} color={t.accent} stroke={3} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

const SecurityScreen = ({ t, onBack }) => {
  const s = useStore(); const lang = s.prefs.lang;
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'security')} onBack={onBack} />
      <div style={{ padding: '0 20px' }}>
        <Card t={t} style={{ padding: '4px 0' }}>
          <ToggleRow t={t} icon="lock" color="#8B5CF6" label="App PIN lock" on={s.prefs.pin} onChange={v => actions.setPref('pin', v)} />
          <ToggleRow t={t} icon="user" color="#06B6D4" label="Biometric unlock" on={s.prefs.biometric} onChange={v => actions.setPref('biometric', v)} last />
        </Card>
      </div>
    </div>
  );
};

const ToggleRow = ({ t, icon, color, label, on, onChange, last }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: last ? 'none' : `1px solid ${t.divider}` }}>
    <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={17} color={color} />
    </div>
    <div style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: 500 }}>{label}</div>
    <Switch on={on} onChange={onChange} t={t} />
  </div>
);

const Switch = ({ on, onChange, t }) => (
  <button onClick={e => { e.stopPropagation(); onChange(!on); }} style={{
    width: 48, height: 28, borderRadius: 14,
    background: on ? t.accent : t.surfaceAlt,
    border: `1px solid ${on ? t.accent : t.borderStrong}`,
    cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 180ms',
  }}>
    <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 180ms', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
  </button>
);

// ── Profile ─────────────────────────────────────
const ProfileScreen = ({ t, onNav, onLogout }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'profile')} />
      <div style={{ padding: '0 20px 18px' }}>
        <Card t={t} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${t.accent}40` }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.profile.avatar}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: -0.3 }}>{s.profile.name}</div>
            <div style={{ fontSize: 12.5, color: t.textSec, marginTop: 2 }}>{s.profile.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7, padding: '2px 7px', borderRadius: 5, background: t.accentSoft, color: t.accent, fontSize: 10.5, fontWeight: 600 }}>
              <Icon name="check" size={10} color={t.accent} stroke={3} /> {tStr(lang, 'pro')}
            </div>
          </div>
        </Card>
      </div>

      <SectionHeader t={t} title={tStr(lang, 'preferences')} />
      <div style={{ padding: '0 20px 16px' }}>
        <Card t={t} style={{ padding: '4px 0' }}>
          <ToggleRow t={t} icon="moon"  color="#6366F1" label={tStr(lang, 'darkMode')} on={s.prefs.dark} onChange={v => { actions.setPref('dark', v); window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { dark: v } }, '*'); }} />
          <NavRow t={t} icon="globe"       color="#06B6D4" label={tStr(lang, 'language')}  detail={lang === 'en' ? 'English' : 'O\u2018zbekcha'} onClick={() => onNav('language')} />
          <NavRow t={t} icon="credit-card" color="#10B981" label={tStr(lang, 'currency')}  detail={s.prefs.currency} onClick={() => onNav('currency')} />
          <NavRow t={t} icon="tag"         color="#F59E0B" label={tStr(lang, 'categoriesLabel')} detail={`${s.categories.length}`} onClick={() => onNav('categories')} last />
        </Card>
      </div>

      <SectionHeader t={t} title={tStr(lang, 'account')} />
      <div style={{ padding: '0 20px 16px' }}>
        <Card t={t} style={{ padding: '4px 0' }}>
          <NavRow t={t} icon="wallet"    color="#EC4899" label={tStr(lang, 'wallets')}   onClick={() => onNav('wallets')} />
          <NavRow t={t} icon="chart"     color="#10B981" label={tStr(lang, 'budgets')}   onClick={() => onNav('budgets')} />
          <NavRow t={t} icon="calendar"  color="#3B82F6" label={lang === 'uz' ? 'Takrorlanuvchi' : 'Recurring'} onClick={() => onNav('recurring')} />
          <NavRow t={t} icon="calendar"  color="#F97316" label={tStr(lang, 'calendar')}  onClick={() => onNav('calendar')} />
          <NavRow t={t} icon="bell"      color="#EC4899" label={tStr(lang, 'notifications')} onClick={() => onNav('notifications')} />
          <NavRow t={t} icon="lock"      color="#8B5CF6" label={tStr(lang, 'security')}  onClick={() => onNav('security')} />
          <NavRow t={t} icon="download"  color="#0EA5E9" label={tStr(lang, 'reports')}  onClick={() => onNav('reports')} last />
        </Card>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <Card t={t} style={{ padding: '4px 0' }}>
          <NavRow t={t} icon="settings" color="#71717A" label={tStr(lang, 'resetData')} onClick={() => { if (confirm('Reset demo data?')) { store.reset(); window.toast?.('Reset'); } }} />
          <NavRow t={t} icon="arrow-up-right" color={t.expense} label={tStr(lang, 'signOut')} onClick={onLogout} last />
        </Card>
      </div>

      <div style={{ padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11.5, color: t.textTer, fontWeight: 500 }}>Ledgr v2.4.0 · Tashkent</div>
      </div>
    </div>
  );
};

const NavRow = ({ t, icon, color, label, detail, onClick, last }) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: last ? 'none' : `1px solid ${t.divider}`, cursor: 'pointer' }}>
    <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={17} color={color} />
    </div>
    <div style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: 500 }}>{label}</div>
    {detail && <div style={{ fontSize: 13, color: t.textSec }}>{detail}</div>}
    <Icon name="chevron-right" size={15} color={t.textTer} />
  </div>
);

// ── Recurring ───────────────────────────────────
const RecurringScreen = ({ t, onBack }) => {
  const s = useStore(); const lang = s.prefs.lang;
  return (
    <div style={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={lang === 'uz' ? 'Takrorlanuvchi' : 'Recurring'} onBack={onBack} />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {s.recurring.map(r => {
          const cat = s.categories.find(c => c.id === r.cat);
          const d = new Date(r.nextDate); const tdy = today();
          const days = Math.round((d - tdy) / 86400000);
          return (
            <Card key={r.id} t={t} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CatIcon cat={r.cat} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{r.note}</div>
                <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{catLabel(cat, lang)} · Every {r.every} · In {days} days</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <MoneyText amount={r.amount} kind={r.kind} t={t} size={14} />
                <Switch t={t} on={r.enabled} onChange={v => actions.updateRecurring(r.id, { enabled: v })} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, {
  StatsScreen, DebtorsScreen, DebtorDetail,
  AllTxScreen, NotificationsScreen, BudgetsScreen, CategoriesScreen,
  WalletsScreen, CalendarScreen, ReportsScreen, TxDetail,
  LanguageScreen, CurrencyScreen, SecurityScreen, ProfileScreen, RecurringScreen,
});
