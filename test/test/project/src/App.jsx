// App — wires auth, onboarding, tabs, nav stack, add sheet, tweaks
const { useState: uSt, useEffect: uEf } = React;

function App() {
  const s = useStore();
  const dark = s.prefs.dark;
  const t = window.makeTokens(dark);
  const lang = s.prefs.lang;

  const [tab, setTab] = uSt(() => localStorage.getItem('ledgr_tab') || 'home');
  const [navStack, setNavStack] = uSt([]); // sub-screens on top of tab
  const [addMode, setAddMode] = uSt(null); // null | 'expense' | 'income' | 'debt' | {edit:tx}
  const [toast, setToast] = uSt(null);
  const [tweaksOpen, setTweaksOpen] = uSt(false);

  uEf(() => { localStorage.setItem('ledgr_tab', tab); }, [tab]);

  // Toast helper
  uEf(() => {
    window.toast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(null), 1800);
    };
    return () => { delete window.toast; };
  }, []);

  // Tweaks host integration
  uEf(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setDark = (v) => {
    actions.setPref('dark', v);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { dark: v } }, '*');
  };

  const push = (screen, data) => setNavStack(st => [...st, { screen, data }]);
  const pop  = () => setNavStack(st => st.slice(0, -1));

  // Auth / onboarding gate
  let rootContent = null;
  if (!s.onboarded) {
    rootContent = <Onboarding t={t} onDone={() => actions.completeOnboarding()} />;
  } else if (!s.loggedIn) {
    rootContent = <LoginScreen t={t} onDone={() => actions.login()} />;
  } else if (navStack.length > 0) {
    const top = navStack[navStack.length - 1];
    const { screen, data } = top;
    switch (screen) {
      case 'all-tx':        rootContent = <AllTxScreen      t={t} onBack={pop} onOpenTx={tx => push('tx', tx)} />; break;
      case 'notifications': rootContent = <NotificationsScreen t={t} onBack={pop} />; break;
      case 'budgets':       rootContent = <BudgetsScreen    t={t} onBack={pop} onAdd={() => {}} />; break;
      case 'categories':    rootContent = <CategoriesScreen t={t} onBack={pop} />; break;
      case 'wallets':       rootContent = <WalletsScreen    t={t} onBack={pop} />; break;
      case 'calendar':      rootContent = <CalendarScreen   t={t} onBack={pop} />; break;
      case 'reports':       rootContent = <ReportsScreen    t={t} onBack={pop} />; break;
      case 'language':      rootContent = <LanguageScreen   t={t} onBack={pop} />; break;
      case 'currency':      rootContent = <CurrencyScreen   t={t} onBack={pop} />; break;
      case 'security':      rootContent = <SecurityScreen   t={t} onBack={pop} />; break;
      case 'recurring':     rootContent = <RecurringScreen  t={t} onBack={pop} />; break;
      case 'debtor':        rootContent = <DebtorDetail     t={t} debtor={data} onBack={pop} />; break;
      case 'tx':            rootContent = <TxDetail         t={t} tx={data} onBack={pop} onEdit={tx => { pop(); setAddMode({ edit: tx }); }} />; break;
      default:              rootContent = null;
    }
  } else {
    switch (tab) {
      case 'home':
        rootContent = <HomeScreen t={t}
          onNav={screen => push(screen)}
          onAdd={mode => setAddMode(mode)}
          onOpenTx={tx => push('tx', tx)} />;
        break;
      case 'stats':    rootContent = <StatsScreen t={t} />; break;
      case 'debtors':  rootContent = <DebtorsScreen t={t}
                        onOpen={d => push('debtor', d)}
                        onAdd={() => setAddMode('debt')}
                        onNav={push} />; break;
      case 'profile':  rootContent = <ProfileScreen t={t}
                        onNav={push}
                        onLogout={() => actions.logout()} />; break;
    }
  }

  const showChrome = s.onboarded && s.loggedIn;

  const screenLabel = (() => {
    if (!s.onboarded) return '00 Onboarding';
    if (!s.loggedIn)  return '00 Login';
    if (navStack.length > 0) return '99 ' + navStack[navStack.length - 1].screen;
    const map = { home: '01 Home', stats: '02 Statistics', debtors: '03 Debtors', profile: '04 Profile' };
    return map[tab];
  })();

  return (
    <div style={{
      minHeight: '100vh', padding: '32px 0',
      background: dark ? '#0a0a0a' : '#e8e8ea',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 200ms',
    }}>
      <div data-screen-label={screenLabel} style={{
        width: 402, height: 874, borderRadius: 48, overflow: 'hidden',
        position: 'relative', background: t.bg,
        boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
        transition: 'background 200ms',
        fontFamily: '-apple-system, system-ui, sans-serif',
      }}>
        {/* dynamic island */}
        <div style={{
          position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
          width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
        }} />

        {/* status bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <IOSStatusBar dark={dark} />
        </div>

        {/* scrollable content */}
        <div key={screenLabel} style={{
          height: '100%', overflowY: 'auto',
          animation: 'tabFade 220ms ease',
        }}>
          {rootContent}
        </div>
        <style>{`
          @keyframes tabFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          input[type="date"]::-webkit-calendar-picker-indicator { filter: ${dark ? 'invert(0.7)' : 'invert(0.3)'}; }
        `}</style>

        {/* tab bar */}
        {showChrome && navStack.length === 0 && (
          <TabBar t={t} active={tab} onChange={setTab}
            onFab={() => setAddMode('expense')} lang={lang} />
        )}

        {/* home indicator */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 70,
          height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          paddingBottom: 8, pointerEvents: 'none',
        }}>
          <div style={{
            width: 139, height: 5, borderRadius: 100,
            background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
          }} />
        </div>

        {/* toast */}
        <Toast toast={toast} t={t} />

        {/* add/edit sheet */}
        {addMode && (
          <AddSheet t={t}
            mode={typeof addMode === 'string' ? addMode : null}
            editTx={addMode?.edit && addMode.edit.kind !== 'debt' ? addMode.edit : null}
            editDebt={null}
            onClose={() => setAddMode(null)} />
        )}
      </div>

      {/* Tweaks panel */}
      {tweaksOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          background: dark ? '#17171B' : '#fff',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 16, padding: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          minWidth: 220,
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: dark ? '#fff' : '#0a0a0a',
            letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 12,
          }}>Tweaks</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={dark ? 'moon' : 'sun'} size={16} color={dark ? '#fff' : '#0a0a0a'} />
              <span style={{ fontSize: 14, color: dark ? '#fff' : '#0a0a0a', fontWeight: 500 }}>
                {dark ? 'Dark' : 'Light'} mode
              </span>
            </div>
            <button onClick={() => setDark(!dark)} style={{
              width: 44, height: 26, borderRadius: 13,
              background: dark ? t.accent : '#e4e4e7',
              border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: dark ? 20 : 2,
                width: 22, height: 22, borderRadius: 11, background: '#fff',
                transition: 'left 180ms',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
