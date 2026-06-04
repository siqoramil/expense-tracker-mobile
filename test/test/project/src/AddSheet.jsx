// Add/Edit transaction + debt sheet — fully wired
const AddSheet = ({ t, mode, editTx, editDebt, onClose }) => {
  const s = useStore();
  const lang = s.prefs.lang;

  const initialKind = editTx ? editTx.kind : editDebt ? 'debt' : mode || 'expense';
  const [kind, setKind] = React.useState(initialKind);
  const [amount, setAmount] = React.useState(
    editTx ? String(editTx.amount) : editDebt ? String(editDebt.amount) : '',
  );
  const [cat, setCat] = React.useState(
    editTx
      ? editTx.cat
      : s.categories.find((c) => c.kind === (initialKind === 'income' ? 'income' : 'expense'))?.id,
  );
  const [wallet, setWallet] = React.useState(editTx ? editTx.wallet : s.wallets[0].id);
  const [note, setNote] = React.useState(
    editTx ? editTx.note || '' : editDebt ? editDebt.note || '' : '',
  );
  const [name, setName] = React.useState(editDebt ? editDebt.name : '');
  const [direction, setDirection] = React.useState(editDebt ? editDebt.direction : 'owe_me');
  const [due, setDue] = React.useState(editDebt ? editDebt.due : daysFromNow(14));
  const [date, setDate] = React.useState(editTx ? editTx.date : isoDate(today()));

  const cats = s.categories.filter((c) => c.kind === (kind === 'income' ? 'income' : 'expense'));

  React.useEffect(() => {
    if (kind !== 'debt') {
      const first = s.categories.find((c) => c.kind === (kind === 'income' ? 'income' : 'expense'));
      if (first && !cats.find((c) => c.id === cat)) setCat(first.id);
    }
  }, [kind]);

  const title =
    kind === 'debt'
      ? editDebt
        ? 'Edit debt'
        : tStr(lang, 'newDebt')
      : editTx
        ? (lang === 'uz' ? 'Tahrirlash' : 'Edit') + ' ' + tStr(lang, kind + '_s').toLowerCase()
        : kind === 'income'
          ? tStr(lang, 'addIncome')
          : tStr(lang, 'addExpense');

  const submit = () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    if (kind === 'debt') {
      if (editDebt) {
        actions.updateDebt(editDebt.id, { name, direction, amount: amt, due, note });
      } else {
        actions.addDebt({
          name: name || 'Unnamed',
          direction,
          amount: amt,
          due,
          note,
          color: ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'][
            Math.floor(Math.random() * 5)
          ],
        });
      }
    } else {
      const payload = { kind, cat, wallet, amount: amt, note, date };
      if (editTx) actions.updateTx(editTx.id, payload);
      else actions.addTx(payload);
    }
    window.toast?.(tStr(lang, 'saved'));
    onClose();
  };

  const handleDelete = () => {
    if (editTx) actions.deleteTx(editTx.id);
    if (editDebt) actions.deleteDebt(editDebt.id);
    window.toast?.(tStr(lang, 'deleted'));
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
      onClick={onClose}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: t.sheetBg,
          borderRadius: '28px 28px 0 0',
          padding: '12px 20px 34px',
          maxHeight: '92%',
          overflowY: 'auto',
          animation: 'slideUp 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 5,
            borderRadius: 3,
            background: t.borderStrong,
            margin: '0 auto 18px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 19, fontWeight: 700, color: t.text, letterSpacing: -0.3 }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: t.surfaceAlt,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color={t.textSec} stroke={2} />
          </button>
        </div>

        {!editTx && !editDebt && (
          <div style={{ marginBottom: 16 }}>
            <SegmentedControl
              t={t}
              value={kind}
              onChange={setKind}
              options={[
                { k: 'expense', label: tStr(lang, 'expense_s') },
                { k: 'income', label: tStr(lang, 'income_s') },
                { k: 'debt', label: lang === 'uz' ? 'Qarz' : 'Debt' },
              ]}
            />
          </div>
        )}

        <div
          style={{
            padding: '14px 0 18px',
            textAlign: 'center',
            borderBottom: `1px solid ${t.divider}`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: t.textSec,
              fontWeight: 600,
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            {tStr(lang, 'amount').toUpperCase()}
          </div>
          <div
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}
          >
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: amount
                  ? kind === 'income'
                    ? t.income
                    : kind === 'debt'
                      ? t.accent
                      : t.expense
                  : t.textTer,
                letterSpacing: -1.4,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {amount
                ? (kind === 'income' ? '+' : kind === 'expense' ? '−' : '') +
                  fmtMoney(Number(amount), s.prefs.currency)
                : s.prefs.currency === 'USD'
                  ? '$0'
                  : '0'}
            </div>
            {s.prefs.currency === 'UZS' && (
              <div style={{ fontSize: 15, color: t.textSec, fontWeight: 500 }}>so'm</div>
            )}
          </div>
        </div>

        {kind === 'debt' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <SegmentedControl
              t={t}
              value={direction}
              onChange={setDirection}
              options={[
                { k: 'owe_me', label: tStr(lang, 'oweMe') },
                { k: 'i_owe', label: tStr(lang, 'iOwe') },
              ]}
            />
            <Field t={t} label={tStr(lang, 'person')}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Azizbek Karimov"
                style={inputStyle(t)}
              />
            </Field>
            <Field t={t} label={tStr(lang, 'dueDate')}>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                style={inputStyle(t)}
              />
            </Field>
            <Field t={t} label={tStr(lang, 'note')}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={lang === 'uz' ? 'Nima uchun?' : 'What for?'}
                style={inputStyle(t)}
              />
            </Field>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: t.textSec,
                marginBottom: 8,
                letterSpacing: 0.2,
              }}
            >
              {tStr(lang, 'category').toUpperCase()}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 8,
                marginBottom: 14,
              }}
            >
              {cats.map((c) => {
                const on = cat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 14,
                      background: on ? c.color + '22' : t.surfaceAlt,
                      border: `1.5px solid ${on ? c.color : 'transparent'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    <Icon name={c.icon} size={19} color={c.color} stroke={2} />
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.text }}>
                      {catLabel(c, lang)}
                    </div>
                  </button>
                );
              })}
            </div>

            <Field t={t} label={tStr(lang, 'wallet')}>
              <div style={{ display: 'flex', gap: 6 }}>
                {s.wallets.map((w) => {
                  const on = wallet === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWallet(w.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 10,
                        background: on ? w.color + '22' : t.surfaceAlt,
                        border: `1.5px solid ${on ? w.color : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name={w.icon} size={14} color={w.color} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                        {walletName(w, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field t={t} label={tStr(lang, 'note')} mt={10}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={lang === 'uz' ? 'Izoh (ixtiyoriy)' : 'Add a note (optional)'}
                style={inputStyle(t)}
              />
            </Field>

            <Field t={t} label={tStr(lang, 'date')} mt={10}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle(t)}
              />
            </Field>
          </>
        )}

        <Numpad
          t={t}
          onPress={(k) => {
            if (k === 'back') setAmount((a) => a.slice(0, -1));
            else if (k === '.') {
              if (!amount.includes('.')) setAmount((a) => (a || '0') + '.');
            } else setAmount((a) => (a + k).replace(/^0+(\d)/, '$1'));
          }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {(editTx || editDebt) && (
            <button
              onClick={handleDelete}
              style={{
                padding: '15px 18px',
                borderRadius: 14,
                background: t.expenseSoft,
                color: t.expense,
                border: 'none',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Icon name="close" size={18} color={t.expense} stroke={2.5} />
            </button>
          )}
          <button
            onClick={submit}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: 14,
              background: t.accent,
              color: '#fff',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${t.accent}4d`,
            }}
          >
            {tStr(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = (t) => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  background: t.surfaceAlt,
  border: `1px solid ${t.border}`,
  color: t.text,
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
});

const Field = ({ t, label, children, mt }) => (
  <div style={{ marginTop: mt }}>
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: t.textSec,
        marginBottom: 5,
        letterSpacing: 0.3,
      }}
    >
      {label.toUpperCase()}
    </div>
    {children}
  </div>
);

const Numpad = ({ t, onPress }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => {
            if (k === '000') {
              onPress('0');
              onPress('0');
              onPress('0');
            } else onPress(k);
          }}
          style={{
            padding: '12px 0',
            borderRadius: 12,
            background: t.surfaceAlt,
            border: `1px solid ${t.border}`,
            fontSize: 19,
            fontWeight: 600,
            color: t.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFeatureSettings: '"tnum"',
          }}
        >
          {k === 'back' ? <Icon name="close" size={17} color={t.textSec} /> : k}
        </button>
      ))}
    </div>
  );
};

window.AddSheet = AddSheet;
