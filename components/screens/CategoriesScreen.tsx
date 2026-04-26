import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tStr } from '../../lib/i18n';
import { actions, catLabel, useStore } from '../../lib/store';
import { toast } from '../../lib/toast';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, CatIcon, ScreenHeader } from '../ui';

export const CategoriesScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'categoriesLabel')} onBack={onBack} />
      <View style={{ paddingHorizontal: 20 }}>
        {(['expense', 'income'] as const).map((kind) => (
          <View key={kind} style={{ marginBottom: 18 }}>
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
              {tStr(lang, kind + '_s')}
            </Text>
            <Card t={t} style={{ paddingHorizontal: 16 }}>
              {s.categories
                .filter((c) => c.kind === kind)
                .map((c, i, arr) => (
                  <View
                    key={c.id}
                    style={{
                      paddingVertical: 11,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderBottomWidth: i === arr.length - 1 ? 0 : StyleSheet.hairlineWidth,
                      borderBottomColor: t.divider,
                    }}
                  >
                    <CatIcon cat={c.id} size={34} />
                    <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '500', color: t.text }}>
                      {catLabel(c, lang)}
                    </Text>
                    <Pressable
                      onPress={() => {
                        actions.deleteCategory(c.id);
                        toast(tStr(lang, 'deleted'));
                      }}
                      style={{ padding: 6 }}
                    >
                      <Icon name="close" size={16} color={t.textTer} />
                    </Pressable>
                  </View>
                ))}
            </Card>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
