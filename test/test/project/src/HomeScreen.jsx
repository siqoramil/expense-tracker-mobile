// Home screen — fully wired to store. Month switcher, wallets, sparkline, goal, upcoming bills.
const HomeScreen = ({ t, onNav, onAdd, onOpenTx }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const months = last6Months();
  const [monthIdx, setMonthIdx] = React.useState(months.length - 1);
  const month = months[monthIdx];
  const monthData = selectMonth(s, month.key);
  const [hideBalance, setHideBalance] = React.useState(false);
  const [variant, setVariant] = React.useState(() => localStorage.getItem('ledgr_home_variant') || 'net'); // net | balance | wallet

  React.useEffect(() => { localStorage.setItem('ledgr_home_variant', variant); }, [variant]);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return tStr(lang, 'goodMorning');
    if (h < 18) return tStr(lang, 'goodAfternoon');
    return tStr(lang, 'goodEvening');
  };

  const net = monthData.net;
  const income = monthData.income;
  const expense = monthData.expense;
  const pctSaved = income > 0 ? Math.round((net / income) * 100) : 0;
  const totalBalance = s.wallets.reduce((a, w) => a + w.balance, 0);

  // Daily spending sparkline (last 14 days)
  const spark = React.useMemo(() => {
    const days = [];
    const tdy = today();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(tdy); d.setDate(tdy.getDate() - i);
      const iso = isoDate(d);
      const v = s.tx.filter(x => x.date === iso && x.kind === 'expense').reduce((a, x) => a + x.amount, 0);
      days.push(v);
    }
    return days;
  }, [s.tx]);

  // Upcoming bills (from recurring, next 10 days)
  const upcoming = s.recurring
    .filter(r => r.enabled && r.kind === 'expense')
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 3);

  const heroCard = () => {
    if (variant === 'balance') {
      return (
        <Card t={t} style={{ padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: 80, background: t.accentSoft,
          }} />
          <div style={{ fontSize: 12.5, color: t.textSec, fontWeight: 600, letterSpacing: 0.4, marginBottom: 8 }}>
            TOTAL BALANCE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <div style={{
              fontSize: 38, fontWeight: 700, color: t.text, letterSpacing: -1.4,
              filter: hideBalance ? 'blur(12px)' : 'none', transition: 'filter 200ms',
            }}>{fmtMoney(totalBalance, s.prefs.currency)}</div>
            {s.prefs.currency === 'UZS' && <div style={{ fontSize: 14, color: t.textSec, fontWeight: 500 }}>so'm</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {s.wallets.map(w => (
              <div key={w.id} style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                background: w.color + '14', border: `1px solid ${w.color}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Icon name={w.icon} size={13} color={w.color} />
                  <div style={{ fontSize: 10.5, color: t.textSec, fontWeight: 600 }}>{walletName(w, lang)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFeatureSettings: '"tnum"' }}>
                  {fmtMoney(w.balance, s.prefs.currency)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }
    // Default 'net'
    return (
      <Card t={t} style={{ padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: 80, background: t.accentSoft, pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, color: t.textSec, fontWeight: 600, letterSpacing: 0.4 }}>
            {tStr(lang, 'netThisMonth')}
          </div>
          {pctSaved >= 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 6,
              background: t.incomeSoft, color: t.income,
              fontSize: 11, fontWeight: 600,
            }}>
              <Icon name="arrow-up" size={10} color={t.income} stroke={2.5} /> {pctSaved}%
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <div style={{
            fontSize: 38, fontWeight: 700, color: t.text, letterSpacing: -1.4,
            filter: hideBalance ? 'blur(12px)' : 'none', transition: 'filter 200ms',
            fontFeatureSettings: '"tnum"',
          }}>
            {fmtMoney(net, s.prefs.currency)}
          </div>
          {s.prefs.currency === 'UZS' && <div style={{ fontSize: 14, color: t.textSec, fontWeight: 500 }}>so'm</div>}
        </div>
        <div style={{ fontSize: 13, color: t.textSec }}>
          {tStr(lang, 'keptPct', { pct: pctSaved })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <MiniStat label={tStr(lang, 'income')}   amount={income}  kind="income"  t={t} />
          <MiniStat label={tStr(lang, 'expenses')} amount={expense} kind="expense" t={t} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{
            height: 8, borderRadius: 4, background: t.expenseSoft, overflow: 'hidden', display: 'flex',
          }}>
            <div style={{
              width: `${income + expense > 0 ? (income / (income + expense)) * 100 : 50}%`,
              background: t.income, height: '100%',
            }} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '72px 20px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: t.textSec, fontWeight: 500, marginBottom: 4 }}>{greet()},</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: t.text, letterSpacing: -0.6 }}>{s.profile.name.split(' ')[0]}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton icon={hideBalance ? 'eye-off' : 'eye'} onClick={() => setHideBalance(!hideBalance)} t={t} />
          <IconButton icon="bell" onClick={() => onNav('notifications')} t={t} badge={s.notifs.filter(n => !n.read).length} />
        </div>
      </div>

      {/* Month switcher */}
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
        {months.map((m, i) => {
          const on = i === monthIdx;
          return (
            <button key={m.key} onClick={() => setMonthIdx(i)} style={{
              padding: '6px 14px', borderRadius: 100, flexShrink: 0,
              background: on ? t.text : t.surface,
              color: on ? t.surface : t.textSec,
              border: `1px solid ${on ? t.text : t.border}`,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 150ms',
            }}>{m.label}</button>
          );
        })}
      </div>

      {/* Hero */}
      <div style={{ padding: '0 20px 12px' }}>{heroCard()}</div>

      {/* Variant toggle */}
      <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'center', gap: 6 }}>
        {[{ k: 'net', l: 'Month' }, { k: 'balance', l: 'Balance' }].map(v => (
          <button key={v.k} onClick={() => setVariant(v.k)} style={{
            padding: '4px 10px', borderRadius: 6,
            background: variant === v.k ? t.accentSoft : 'transparent',
            color: variant === v.k ? t.accent : t.textTer,
            border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>{v.l}</button>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
        <QuickAction icon="arrow-down-left" label={tStr(lang, 'addIncome')}  color={t.income}  t={t} onClick={() => onAdd('income')} />
        <QuickAction icon="arrow-up-right"  label={tStr(lang, 'addExpense')} color={t.expense} t={t} onClick={() => onAdd('expense')} />
        <QuickAction icon="users"           label={tStr(lang, 'lend')}       color={t.accent}  t={t} onClick={() => onAdd('debt')} />
      </div>

      {/* Wallets */}
      <SectionHeader t={t} title={tStr(lang, 'myWallets')} action={tStr(lang, 'seeAll')} onAction={() => onNav('wallets')} />
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10, overflowX: 'auto' }}>
        {s.wallets.map(w => (
          <button key={w.id} onClick={() => onNav('wallets')} style={{
            flexShrink: 0, width: 150, padding: '14px 14px 16px', borderRadius: 16,
            background: t.surface, border: `1px solid ${t.border}`,
            textAlign: 'left', cursor: 'pointer',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: w.color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Icon name={w.icon} size={17} color={w.color} />
            </div>
            <div style={{ fontSize: 12, color: t.textSec, marginBottom: 2, fontWeight: 500 }}>{walletName(w, lang)}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: -0.3, fontFeatureSettings: '"tnum"' }}>
              {fmtMoney(w.balance, s.prefs.currency)}
            </div>
          </button>
        ))}
      </div>

      {/* Savings goal */}
      {s.goal && (
        <>
          <SectionHeader t={t} title={tStr(lang, 'savingsGoal')} />
          <div style={{ padding: '0 20px 20px' }}>
            <Card t={t} style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: '#F59E0B22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="trending-up" size={18} color="#F59E0B" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{s.goal.title[lang] || s.goal.title.en}</div>
                    <div style={{ fontSize: 12, color: t.textSec, marginTop: 1 }}>
                      {fmtMoney(s.goal.saved, s.prefs.currency)} / {fmtMoney(s.goal.target, s.prefs.currency)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFeatureSettings: '"tnum"' }}>
                  {Math.round((s.goal.saved / s.goal.target) * 100)}%
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: t.surfaceAlt, overflow: 'hidden' }}>
                <div style={{
                  width: `${(s.goal.saved / s.goal.target) * 100}%`, height: '100%',
                  background: '#F59E0B', borderRadius: 3, transition: 'width 300ms',
                }} />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Daily spending sparkline */}
      <SectionHeader t={t} title={tStr(lang, 'daily')} />
      <div style={{ padding: '0 20px 20px' }}>
        <Card t={t} style={{ padding: '14px 16px' }}>
          <Sparkline data={spark} t={t} color={t.expense} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: t.textTer }}>
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </Card>
      </div>

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <>
          <SectionHeader t={t} title={tStr(lang, 'upcomingBills')} action={tStr(lang, 'seeAll')} onAction={() => onNav('recurring')} />
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(r => {
              const cat = s.categories.find(c => c.id === r.cat);
              const d = new Date(r.nextDate); const tdy = today();
              const days = Math.round((d - tdy) / (1000 * 60 * 60 * 24));
              return (
                <Card key={r.id} t={t} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CatIcon cat={r.cat} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{r.note}</div>
                    <div style={{ fontSize: 11.5, color: t.textSec, marginTop: 1 }}>In {days} {days === 1 ? 'day' : 'days'}</div>
                  </div>
                  <MoneyText amount={r.amount} kind={r.kind} t={t} size={14} />
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Recent activity */}
      <SectionHeader t={t} title={tStr(lang, 'recentActivity')} action={tStr(lang, 'seeAll')} onAction={() => onNav('all-tx')} />
      <div style={{ padding: '0 20px' }}>
        {monthData.tx.length === 0 ? (
          <Card t={t} style={{ padding: '8px 16px' }}>
            <EmptyState icon="wallet" title={tStr(lang, 'noTransactions')} subtitle={tStr(lang, 'noTransactionsSub')} t={t} />
          </Card>
        ) : (
          <Card t={t} style={{ padding: '4px 16px' }}>
            {monthData.tx.slice(0, 6).map((tx, i, arr) => (
              <TxRow key={tx.id} tx={tx} t={t} last={i === arr.length - 1}
                onTap={() => onOpenTx(tx)}
                onDelete={() => { actions.deleteTx(tx.id); window.toast?.(tStr(lang, 'deleted')); }} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
};

const IconButton = ({ icon, onClick, t, badge }) => (
  <button onClick={onClick} style={{
    position: 'relative',
    width: 40, height: 40, borderRadius: 20,
    background: t.surface, border: `1px solid ${t.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  }}>
    <Icon name={icon} size={18} color={t.textSec} />
    {badge > 0 && (
      <div style={{
        position: 'absolute', top: 4, right: 4,
        minWidth: 16, height: 16, borderRadius: 8,
        background: t.expense, color: '#fff',
        fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px', boxSizing: 'border-box',
        border: `1.5px solid ${t.surface}`,
      }}>{badge}</div>
    )}
  </button>
);

const MiniStat = ({ label, amount, kind, t }) => {
  const up = kind === 'income';
  const color = up ? t.income : t.expense;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 9,
          background: up ? t.incomeSoft : t.expenseSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={up ? 'arrow-down-left' : 'arrow-up-right'} size={11} color={color} stroke={2.5} />
        </div>
        <div style={{ fontSize: 12.5, color: t.textSec, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: t.text, fontFeatureSettings: '"tnum"', letterSpacing: -0.3 }}>
        {fmtMoney(amount, store.get().prefs.currency)}
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, color, t, onClick }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: '14px 10px', borderRadius: 16,
    background: t.surface, border: `1px solid ${t.border}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer', transition: 'transform 100ms',
  }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
     onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
     onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
    <div style={{
      width: 36, height: 36, borderRadius: 18, background: color + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={18} color={color} stroke={2.2} />
    </div>
    <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>{label}</div>
  </button>
);

const Sparkline = ({ data, t, color }) => {
  const max = Math.max(...data, 1);
  const W = 320, H = 50;
  const n = data.length;
  const step = W / (n - 1);
  const pts = data.map((v, i) => [i * step, H - (v / max) * H + 4]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = path + ` L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 6}`} width="100%" style={{ display: 'block' }}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => i === pts.length - 1 && (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} />
      ))}
    </svg>
  );
};

window.HomeScreen = HomeScreen;
