// Shared UI atoms
const CatIcon = ({ cat, size = 40 }) => {
  const c = store.get().categories.find((x) => x.id === cat);
  if (!c) return <div style={{ width: size, height: size }} />;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.5,
        background: c.color + '22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={c.icon} size={size * 0.5} color={c.color} stroke={2} />
    </div>
  );
};

const MoneyText = ({ amount, kind, t, size = 15, mono = true }) => {
  const { prefs } = store.get();
  const up = kind === 'income';
  const color = kind == null ? t.text : up ? t.income : t.expense;
  const sign = kind == null ? '' : up ? '+' : '−';
  return (
    <span
      style={{
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
        fontSize: size,
        fontWeight: 600,
        color,
        whiteSpace: 'nowrap',
        fontFeatureSettings: '"tnum"',
      }}
    >
      {sign}
      {window.fmtMoney(Math.abs(amount), prefs.currency)}
      {prefs.currency === 'UZS' && (
        <span style={{ opacity: 0.5, marginLeft: 4, fontSize: size * 0.75 }}>so'm</span>
      )}
    </span>
  );
};

// Transaction row (tap + swipe-to-delete)
const TxRow = ({ tx, t, last, onTap, onDelete }) => {
  const [sw, setSw] = React.useState(0);
  const [sx, setSx] = React.useState(null);
  const s = store.get();
  const lang = s.prefs.lang;
  const cat = s.categories.find((c) => c.id === tx.cat);

  const onTouchStart = (e) => setSx(e.touches[0].clientX);
  const onTouchMove = (e) => {
    if (sx != null) setSw(Math.min(0, Math.max(-100, e.touches[0].clientX - sx)));
  };
  const onTouchEnd = () => {
    setSx(null);
    if (sw < -60) setSw(-80);
    else setSw(0);
  };
  const onMouseDown = (e) => setSx(e.clientX);
  const onMouseMove = (e) => {
    if (sx != null) setSw(Math.min(0, Math.max(-100, e.clientX - sx)));
  };
  const onMouseUp = () => {
    setSx(null);
    if (sw < -60) setSw(-80);
    else setSw(0);
  };

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: last ? 'none' : `1px solid ${t.divider}`,
      }}
    >
      {/* delete bg */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: t.expense,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={onDelete}
      >
        <Icon name="close" size={20} color="#fff" stroke={2.5} />
      </div>
      <div
        onClick={() => sw === 0 && onTap?.(tx)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
          transform: `translateX(${sw}px)`,
          transition: sx == null ? 'transform 180ms' : 'none',
          background: t.surface,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <CatIcon cat={tx.cat} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: t.text,
              letterSpacing: -0.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tx.note || catLabel(cat, lang)}
          </div>
          <div style={{ fontSize: 12.5, color: t.textSec, marginTop: 2 }}>
            {catLabel(cat, lang)} · {fmtDate(tx.date, lang)}
          </div>
        </div>
        <MoneyText amount={tx.amount} kind={tx.kind} t={t} />
      </div>
    </div>
  );
};

const SectionHeader = ({ title, action, onAction, t }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      padding: '0 20px',
      marginBottom: 10,
    }}
  >
    <div
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: t.textSec,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}
    >
      {title}
    </div>
    {action && (
      <div
        onClick={onAction}
        style={{
          fontSize: 13,
          color: t.accent,
          fontWeight: 500,
          cursor: onAction ? 'pointer' : 'default',
        }}
      >
        {action}
      </div>
    )}
  </div>
);

const Card = ({ children, style, t, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: t.surface,
      borderRadius: 20,
      border: `1px solid ${t.border}`,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
  >
    {children}
  </div>
);

// Tab bar — also accepts translation fn
const TabBar = ({ active, onChange, onFab, t, lang }) => {
  const tabs = [
    { k: 'home', label: tStr(lang, 'home'), icon: 'home', iconFill: 'home-fill' },
    { k: 'stats', label: tStr(lang, 'statistics'), icon: 'chart', iconFill: 'chart-fill' },
    { k: '__fab', fab: true },
    { k: 'debtors', label: tStr(lang, 'debtors'), icon: 'users', iconFill: 'users-fill' },
    { k: 'profile', label: tStr(lang, 'profile'), icon: 'user', iconFill: 'user-fill' },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 34,
        paddingTop: 8,
        background: t.tabBg,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: `0.5px solid ${t.tabBorder}`,
        zIndex: 30,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 8px',
        }}
      >
        {tabs.map((tab) => {
          if (tab.fab) {
            return (
              <button
                key="fab"
                onClick={onFab}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: t.accent,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 6px 20px ${t.accent}55, 0 2px 6px rgba(0,0,0,0.15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -28,
                  transition: 'transform 120ms',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Icon name="plus" size={26} color="#fff" stroke={2.5} />
              </button>
            );
          }
          const on = active === tab.k;
          return (
            <button
              key={tab.k}
              onClick={() => onChange(tab.k)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                flex: 1,
                color: on ? t.accent : t.textSec,
                transition: 'color 150ms',
              }}
            >
              <Icon
                name={on ? tab.iconFill : tab.icon}
                size={24}
                color={on ? t.accent : t.textSec}
                stroke={1.8}
              />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.1 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Screen header with optional back + trailing + sub
const ScreenHeader = ({ title, subtitle, trailing, t, onBack }) => (
  <div style={{ padding: onBack ? '60px 20px 10px' : '72px 20px 16px' }}>
    {onBack && (
      <button
        onClick={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -8,
          marginBottom: 4,
        }}
      >
        <Icon
          name="chevron-right"
          size={22}
          color={t.text}
          stroke={2.5}
          style={{ transform: 'scaleX(-1)' }}
        />
      </button>
    )}
    <div
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {subtitle && (
          <div
            style={{
              fontSize: 13,
              color: t.textSec,
              fontWeight: 500,
              marginBottom: 4,
              letterSpacing: 0.2,
            }}
          >
            {subtitle}
          </div>
        )}
        <div style={{ fontSize: 30, fontWeight: 700, color: t.text, letterSpacing: -0.8 }}>
          {title}
        </div>
      </div>
      {trailing}
    </div>
  </div>
);

const SegmentedControl = ({ options, value, onChange, t }) => (
  <div
    style={{
      display: 'flex',
      gap: 4,
      padding: 4,
      borderRadius: 12,
      background: t.surfaceAlt,
      border: `1px solid ${t.border}`,
    }}
  >
    {options.map((opt) => {
      const on = value === opt.k;
      return (
        <button
          key={opt.k}
          onClick={() => onChange(opt.k)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 9,
            background: on ? t.surface : 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: on ? t.text : t.textSec,
            fontWeight: on ? 600 : 500,
            fontSize: 13,
            boxShadow: on ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 150ms',
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// Toast / haptic press wrapper
const Press = ({ onClick, children, style }) => (
  <button
    onClick={onClick}
    style={{
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer',
      transition: 'transform 100ms',
      ...style,
    }}
    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
  >
    {children}
  </button>
);

// Toast container
const Toast = ({ toast, t }) => {
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        background: t.text,
        color: t.surface,
        padding: '10px 18px',
        borderRadius: 24,
        fontSize: 14,
        fontWeight: 500,
        zIndex: 200,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'toastIn 260ms cubic-bezier(.22,1,.36,1)',
      }}
    >
      <Icon name="check" size={16} color={t.surface} stroke={3} />
      {toast}
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
};

// Empty state
const EmptyState = ({ icon, title, subtitle, t }) => (
  <div
    style={{
      padding: '40px 20px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <div
      style={{
        width: 68,
        height: 68,
        borderRadius: 34,
        background: t.surfaceAlt,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${t.border}`,
        marginBottom: 6,
      }}
    >
      <Icon name={icon || 'wallet'} size={28} color={t.textTer} stroke={1.8} />
    </div>
    <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: t.textSec, maxWidth: 220 }}>{subtitle}</div>}
  </div>
);

Object.assign(window, {
  CatIcon,
  MoneyText,
  TxRow,
  SectionHeader,
  Card,
  TabBar,
  ScreenHeader,
  SegmentedControl,
  Press,
  Toast,
  EmptyState,
});
