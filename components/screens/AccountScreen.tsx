import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card } from '@/components/ui';
import { EditEmailSheet, EditNameSheet, ForgotPasswordSheet } from '@/components/AccountSheets';
import { NavRow } from '@/components/screens/ProfileScreen';
import { tStr } from '@/lib/i18n';
import { useStore } from '@/lib/store';

export const AccountScreen: React.FC<{ t: Tokens }> = ({ t }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [editName, setEditName] = useState<boolean>(false);
  const [editEmail, setEditEmail] = useState<boolean>(false);
  const [resetPassword, setResetPassword] = useState<boolean>(false);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Card t={t}>
          <NavRow
            t={t}
            icon="user"
            color="#6366F1"
            label={tStr(lang, 'editName')}
            detail={s.profile.name}
            onPress={() => setEditName(true)}
          />
          <NavRow
            t={t}
            icon="mail"
            color="#0EA5E9"
            label={tStr(lang, 'editEmail')}
            detail={s.profile.email}
            onPress={() => setEditEmail(true)}
          />
          <NavRow
            t={t}
            icon="lock"
            color="#8B5CF6"
            label={tStr(lang, 'resetPassword')}
            onPress={() => setResetPassword(true)}
            last
          />
        </Card>
      </View>

      <EditNameSheet t={t} visible={editName} onClose={() => setEditName(false)} />
      <EditEmailSheet t={t} visible={editEmail} onClose={() => setEditEmail(false)} />
      <ForgotPasswordSheet t={t} visible={resetPassword} onClose={() => setResetPassword(false)} />
    </ScrollView>
  );
};
