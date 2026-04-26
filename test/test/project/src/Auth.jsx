// Onboarding carousel
const Onboarding = ({ t, onDone }) => {
  const [i, setI] = React.useState(0);
  const s = store.get();
  const lang = s.prefs.lang;
  const slides = [
    { icon: 'wallet',      title: tStr(lang, 'trackSalary'),    sub: tStr(lang, 'trackSalarySub'),    color: '#6366F1' },
    { icon: 'users',       title: tStr(lang, 'manageDebtors'),  sub: tStr(lang, 'manageDebtorsSub'),  color: '#10B981' },
    { icon: 'trending-up', title: tStr(lang, 'staySavings'),    sub: tStr(lang, 'staySavingsSub'),    color: '#F59E0B' },
  ];
  const cur = slides[i];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '80px 28px 40px', background: t.bg,
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={onDone} style={{
          background: 'none', border: 'none', color: t.textSec,
          fontSize: 15, fontWeight: 500, cursor: 'pointer',
        }}>{tStr(lang, 'skip')}</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <div style={{
          width: 130, height: 130, borderRadius: 36,
          background: cur.color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 250ms',
        }}>
          <Icon name={cur.icon} size={58} color={cur.color} stroke={1.6} />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 300 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 10, letterSpacing: -0.6 }}>{cur.title}</div>
          <div style={{ fontSize: 15, color: t.textSec, lineHeight: 1.5 }}>{cur.sub}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {slides.map((_, j) => (
            <div key={j} style={{
              width: j === i ? 22 : 6, height: 6, borderRadius: 3,
              background: j === i ? t.accent : t.border, transition: 'all 200ms',
            }} />
          ))}
        </div>
      </div>

      <button onClick={() => i < slides.length - 1 ? setI(i + 1) : onDone()} style={{
        padding: '16px', borderRadius: 16,
        background: t.accent, color: '#fff', border: 'none',
        fontSize: 16, fontWeight: 600, cursor: 'pointer',
        boxShadow: `0 4px 14px ${t.accent}40`,
      }}>
        {i < slides.length - 1 ? tStr(lang, 'next') : tStr(lang, 'getStarted')}
      </button>
    </div>
  );
};

// Login / sign-up
const LoginScreen = ({ t, onDone }) => {
  const [mode, setMode] = React.useState('signin'); // signin | signup
  const [email, setEmail] = React.useState('sardor.akmalov@gmail.com');
  const [pw, setPw] = React.useState('••••••••');
  const s = store.get();
  const lang = s.prefs.lang;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '80px 28px 40px', background: t.bg,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        boxShadow: `0 8px 24px ${t.accent}50`,
      }}>
        <Icon name="wallet" size={28} color="#fff" stroke={2.2} />
      </div>

      <div style={{ fontSize: 30, fontWeight: 700, color: t.text, letterSpacing: -0.8, marginBottom: 6 }}>
        {mode === 'signin' ? tStr(lang, 'welcome') : tStr(lang, 'signUp')}
      </div>
      <div style={{ fontSize: 14, color: t.textSec, marginBottom: 32 }}>
        {mode === 'signin' ? 'Sign in to continue to Ledgr' : 'Create your Ledgr account'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSec, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>
            {tStr(lang, 'email').toUpperCase()}
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)} style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            background: t.surface, border: `1px solid ${t.border}`,
            color: t.text, fontSize: 15, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
          }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: t.textSec, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>
            {tStr(lang, 'password').toUpperCase()}
          </div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            background: t.surface, border: `1px solid ${t.border}`,
            color: t.text, fontSize: 15, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
          }} />
        </div>
      </div>

      <button onClick={onDone} style={{
        padding: '16px', borderRadius: 14,
        background: t.accent, color: '#fff', border: 'none',
        fontSize: 16, fontWeight: 600, cursor: 'pointer',
        marginBottom: 20, boxShadow: `0 4px 14px ${t.accent}40`,
      }}>
        {mode === 'signin' ? tStr(lang, 'signIn') : tStr(lang, 'signUp')}
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 20px',
      }}>
        <div style={{ flex: 1, height: 1, background: t.divider }} />
        <div style={{ fontSize: 12, color: t.textTer }}>{tStr(lang, 'orContinue')}</div>
        <div style={{ flex: 1, height: 1, background: t.divider }} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {['Google', 'Apple'].map(p => (
          <button key={p} style={{
            flex: 1, padding: '13px', borderRadius: 14,
            background: t.surface, border: `1px solid ${t.border}`,
            color: t.text, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>{p}</button>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, color: t.textSec }}>
        {mode === 'signin' ? tStr(lang, 'noAccount') : 'Already have an account?'}{' '}
        <span onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ color: t.accent, fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'signin' ? tStr(lang, 'signUp') : tStr(lang, 'signIn')}
        </span>
      </div>
    </div>
  );
};

window.Onboarding = Onboarding;
window.LoginScreen = LoginScreen;
