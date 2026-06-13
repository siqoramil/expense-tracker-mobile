import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card, CatIcon } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { actions, catLabel, type Category, type CategoryKind, useStore } from '@/lib/store';
import { tStr, type Lang } from '@/lib/i18n';

const Row: React.FC<{
  t: Tokens;
  cat: Category;
  isLast: boolean;
  hidden: boolean;
  onToggle: () => void;
  lang: Lang;
}> = ({ t, cat, isLast, hidden, onToggle, lang }) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [
      {
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.divider,
        opacity: pressed ? 0.6 : hidden ? 0.55 : 1,
      },
    ]}
  >
    <CatIcon cat={cat.id} size={34} />
    <Text
      style={{
        flex: 1,
        fontSize: 14.5,
        fontWeight: '500',
        color: hidden ? t.textSec : t.text,
      }}
    >
      {catLabel(cat, lang)}
    </Text>
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: hidden ? t.accent + '22' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={hidden ? 'plus' : 'close'} size={16} color={hidden ? t.accent : t.textTer} />
    </View>
  </Pressable>
);

const SectionHeader: React.FC<{ t: Tokens; label: string }> = ({ t, label }) => (
  <Text
    style={{
      fontSize: 12,
      color: t.textSec,
      fontWeight: '600',
      marginBottom: 8,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    }}
  >
    {label}
  </Text>
);

export const CategoriesScreen: React.FC<{ t: Tokens }> = ({ t }) => {
  const s = useStore();
  const lang = s.prefs.lang;

  const renderKind = (kind: CategoryKind) => {
    const all = s.categories.filter((c) => c.kind === kind);
    const active = all.filter((c) => !c.hidden);
    const inactive = all.filter((c) => c.hidden);

    return (
      <View key={kind} style={{ marginBottom: 22 }}>
        <SectionHeader t={t} label={tStr(lang, kind + '_s')} />

        {active.length > 0 ? (
          <Card t={t} style={{ paddingHorizontal: 16, marginBottom: 10 }}>
            {active.map((c, i) => (
              <Row
                key={c.id}
                t={t}
                cat={c}
                hidden={false}
                isLast={i === active.length - 1}
                onToggle={() => actions.setCategoryHidden(c.id, true)}
                lang={lang}
              />
            ))}
          </Card>
        ) : null}

        {inactive.length > 0 ? (
          <>
            <Text
              style={{
                fontSize: 11,
                color: t.textTer,
                fontWeight: '600',
                marginTop: 4,
                marginBottom: 6,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              {tStr(lang, 'disabled')}
            </Text>
            <Card t={t} style={{ paddingHorizontal: 16 }}>
              {inactive.map((c, i) => (
                <Row
                  key={c.id}
                  t={t}
                  cat={c}
                  hidden
                  isLast={i === inactive.length - 1}
                  onToggle={() => actions.setCategoryHidden(c.id, false)}
                  lang={lang}
                />
              ))}
            </Card>
          </>
        ) : null}
      </View>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ paddingHorizontal: 20 }}>
        {(['expense', 'subscription', 'income'] as const).map(renderKind)}
      </View>
    </ScrollView>
  );
};
