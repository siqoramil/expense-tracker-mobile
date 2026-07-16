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
import Svg, { Circle, Path } from 'react-native-svg';

const PERKS: { icon: IconName; key: string; descKey: string }[] = [
  { icon: 'chart', key: 'perkReports', descKey: 'perkReportsDesc' },
  { icon: 'wallet', key: 'perkWallets', descKey: 'perkWalletsDesc' },
  { icon: 'calendar', key: 'perkBudgets', descKey: 'perkBudgetsDesc' },
  { icon: 'gift', key: 'perkSupport', descKey: 'perkSupportDesc' },
];

const CrownGlyph = ({ size = 30, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M3 8.2l3.9 2.6L11 4.6a1.2 1.2 0 0 1 2 0l4.1 6.2L21 8.2a1 1 0 0 1 1.56 1.02l-1.7 8.05a1.4 1.4 0 0 1-1.37 1.1H4.51a1.4 1.4 0 0 1-1.37-1.1L1.44 9.22A1 1 0 0 1 3 8.2z"
      fill={color}
    />
    <Path d="M6 20.6h12" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
  </Svg>
);

// Small decorative sparkle used to dress the hero.
const Sparkle = ({
  size = 14,
  color = '#fff',
  opacity = 1,
}: { size?: number; color?: string; opacity?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
    <Path
      d="M12 2c.4 3.9 1.9 5.4 5.8 5.8v.4C13.9 8.6 12.4 10.1 12 14c-.4-3.9-1.9-5.4-5.8-5.8v-.4C10.1 7.4 11.6 5.9 12 2z"
      fill={color}
    />
    <Circle cx="19" cy="16" r="1.6" fill={color} />
    <Circle cx="6" cy="17" r="1.1" fill={color} />
  </Svg>
);

const packagesOf = (o: PurchasesOffering | null): PurchasesPackage[] => {
  if (!o) return [];
  const ordered = [o.annual, o.monthly].filter((p): p is PurchasesPackage => p != null);
  return ordered.length ? ordered : o.availablePackages;
};

export const PaywallScreen = ({ t, onDone }: { t: Tokens; onDone?: () => void }) => {
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
  const accentDark = t.dark ? '#0a7a5a' : '#036b4a';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: 160 }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        {/* ── Hero ── accent card with layered depth, sparkles and a crown badge ── */}
        <View
          style={{
            borderRadius: 28,
            backgroundColor: t.accent,
            overflow: 'hidden',
            paddingTop: 34,
            paddingBottom: 32,
            paddingHorizontal: 24,
            alignItems: 'center',
            marginBottom: 26,
            shadowColor: t.accent,
            shadowOpacity: t.dark ? 0.45 : 0.32,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 10,
          }}
        >
          {/* depth circles */}
          <View
            style={{
              position: 'absolute',
              top: -60,
              right: -50,
              width: 190,
              height: 190,
              borderRadius: 95,
              backgroundColor: accentDark,
              opacity: 0.45,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -55,
              left: -40,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: accentDark,
              opacity: 0.3,
            }}
          />
          {/* thin ring accent, top-left */}
          <View
            style={{
              position: 'absolute',
              top: 24,
              left: -30,
              width: 110,
              height: 110,
              borderRadius: 55,
              borderWidth: 18,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          />
          {/* sparkles */}
          <View style={{ position: 'absolute', top: 26, right: 30 }}>
            <Sparkle size={18} opacity={0.9} />
          </View>
          <View style={{ position: 'absolute', top: 74, left: 34 }}>
            <Sparkle size={12} opacity={0.55} />
          </View>

          {/* PRO pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(255,255,255,0.16)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <Sparkle size={11} />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>
              PRO
            </Text>
          </View>

          {/* crown badge */}
          <View
            style={{
              width: 78,
              height: 78,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(255,255,255,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <CrownGlyph size={38} />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: '#fff',
              letterSpacing: -0.5,
              textAlign: 'center',
            }}
          >
            {tStr(lang, isPremium ? 'premiumActive' : 'premiumTitle')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.92)',
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 20,
              maxWidth: 300,
            }}
          >
            {tStr(lang, isPremium ? 'premiumActiveDesc' : 'premiumSubtitle')}
          </Text>
        </View>

        {/* ── Perks ── */}
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: '700',
            color: t.textSec,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          {tStr(lang, 'premiumIncluded')}
        </Text>
        <Card t={t} style={{ marginBottom: 22, paddingHorizontal: 16 }}>
          {PERKS.map((perk, i) => (
            <View
              key={perk.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: i === PERKS.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: t.divider,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: t.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 13,
                }}
              >
                <Icon name={perk.icon} size={19} color={t.accent} stroke={2} />
              </View>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 15, color: t.text, fontWeight: '600' }}>
                  {tStr(lang, perk.key)}
                </Text>
                <Text style={{ fontSize: 12.5, color: t.textSec, marginTop: 2, lineHeight: 17 }}>
                  {tStr(lang, perk.descKey)}
                </Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: t.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={14} color="#fff" stroke={3} />
              </View>
            </View>
          ))}
        </Card>

        {isPremium ? null : loading ? (
          <ActivityIndicator color={t.accent} style={{ marginVertical: 24 }} />
        ) : pkgs.length === 0 ? (
          <>
            {/* ── Unavailable state ── informative card, keeps restore reachable ── */}
            <Card t={t} style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: t.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Icon name="info" size={24} color={t.textSec} stroke={2} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 6 }}>
                {tStr(lang, 'paywallUnavailableTitle')}
              </Text>
              <Text
                style={{ fontSize: 13.5, color: t.textSec, textAlign: 'center', lineHeight: 19 }}
              >
                {tStr(lang, 'paywallUnavailable')}
              </Text>
            </Card>

            <Pressable onPress={restore} style={{ alignSelf: 'center', padding: 14, marginTop: 8 }}>
              <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
                {tStr(lang, 'restorePurchases')}
              </Text>
            </Pressable>
          </>
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
