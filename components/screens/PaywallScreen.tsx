import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import type { Tokens } from '@/lib/tokens';
import { Button, Card } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { getOfferings, purchasePackage, restorePurchases, usePremium } from '@/lib/purchases';

const PERKS: { icon: IconName; key: string }[] = [
  { icon: 'chart', key: 'perkReports' },
  { icon: 'wallet', key: 'perkWallets' },
  { icon: 'calendar', key: 'perkBudgets' },
  { icon: 'gift', key: 'perkSupport' },
];

const packagesOf = (o: PurchasesOffering | null): PurchasesPackage[] => {
  if (!o) return [];
  const ordered = [o.annual, o.monthly].filter((p): p is PurchasesPackage => p != null);
  return ordered.length ? ordered : o.availablePackages;
};

export const PaywallScreen: React.FC<{ t: Tokens; onDone?: () => void }> = ({ t, onDone }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const isPremium = usePremium();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getOfferings().then((o) => {
      if (!active) return;
      const pkgs = packagesOf(o);
      setOffering(o);
      setSelected(pkgs.find((p) => p.packageType === 'ANNUAL') ?? pkgs[0] ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const buy = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const res = await purchasePackage(selected);
    setBusy(false);
    if (res === 'success') {
      toast(tStr(lang, 'premiumThanks'), 'success');
      onDone?.();
    } else if (res === 'error') {
      toast(tStr(lang, 'purchaseFailed'), 'error');
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await restorePurchases();
    setBusy(false);
    toast(tStr(lang, ok ? 'restoreSuccess' : 'restoreNone'), ok ? 'success' : 'info');
  };

  const pkgs = packagesOf(offering);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        {/* ── Hero ── */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: t.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Icon name="gift" size={30} color={t.accent} stroke={2} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>
            {tStr(lang, isPremium ? 'premiumActive' : 'premiumTitle')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: t.textSec,
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {tStr(lang, isPremium ? 'premiumActiveDesc' : 'premiumSubtitle')}
          </Text>
        </View>

        {/* ── Perks ── */}
        <Card t={t} style={{ marginBottom: 18 }}>
          {PERKS.map((perk, i) => (
            <View
              key={perk.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: i === PERKS.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: t.divider,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: t.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Icon name={perk.icon} size={17} color={t.accent} stroke={2} />
              </View>
              <Text style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: '500' }}>
                {tStr(lang, perk.key)}
              </Text>
              <Icon name="check" size={18} color={t.accent} stroke={2.4} />
            </View>
          ))}
        </Card>

        {isPremium ? null : loading ? (
          <ActivityIndicator color={t.accent} style={{ marginVertical: 24 }} />
        ) : pkgs.length === 0 ? (
          <Card t={t}>
            <Text style={{ fontSize: 14, color: t.textSec, textAlign: 'center', lineHeight: 20 }}>
              {tStr(lang, 'paywallUnavailable')}
            </Text>
          </Card>
        ) : (
          <>
            {/* ── Plan selector ── */}
            {pkgs.map((pkg) => {
              const active = selected?.identifier === pkg.identifier;
              const isAnnual = pkg.packageType === 'ANNUAL';
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelected(pkg)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                    borderColor: active ? t.accent : t.border,
                    backgroundColor: active ? t.accentSoft : t.surface,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>
                        {tStr(lang, isAnnual ? 'planYearly' : 'planMonthly')}
                      </Text>
                      {isAnnual ? (
                        <View
                          style={{
                            backgroundColor: t.accent,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
                            {tStr(lang, 'bestValue')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 13, color: t.textSec, marginTop: 3 }}>
                      {pkg.product.priceString}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: active ? t.accent : t.border,
                      backgroundColor: active ? t.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {active ? <Icon name="check" size={13} color="#fff" stroke={3} /> : null}
                  </View>
                </Pressable>
              );
            })}

            <Button
              t={t}
              label={tStr(lang, 'subscribeCta')}
              onPress={buy}
              loading={busy}
              size="lg"
              style={{ marginTop: 6 }}
            />

            <Pressable onPress={restore} style={{ alignSelf: 'center', padding: 12, marginTop: 6 }}>
              <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
                {tStr(lang, 'restorePurchases')}
              </Text>
            </Pressable>

            <Text
              style={{
                fontSize: 11,
                color: t.textTer,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 16,
              }}
            >
              {tStr(lang, 'paywallTerms')}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
};
