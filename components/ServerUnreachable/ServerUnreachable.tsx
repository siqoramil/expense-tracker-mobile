import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui';
import { authApi, getServerStatus, subscribeServerStatus } from '@/lib/api';
import { tStr, type Lang } from '@/lib/i18n';

type Props = {
  t: Tokens;
  lang: Lang;
};

export const ServerUnreachable: React.FC<Props> = ({ t, lang }) => {
  const [visible, setVisible] = useState(getServerStatus() === 'unreachable');
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => subscribeServerStatus((s) => setVisible(s === 'unreachable')), []);

  if (!visible) return null;

  const onRetry = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await authApi.ping();
    } catch {
      // Ignore — subscribeServerStatus will keep `visible` true if still down.
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]} pointerEvents="auto">
      <StatusBar barStyle={t.dark ? 'light-content' : 'dark-content'} />
      <View style={[styles.iconWrap, { backgroundColor: t.expenseSoft }]}>
        <Icon name="globe" size={48} color={t.expense} stroke={2} />
      </View>
      <Text style={[styles.title, { color: t.text }]}>{tStr(lang, 'serverDown_title')}</Text>
      <Text style={[styles.sub, { color: t.textSec }]}>{tStr(lang, 'serverDown_sub')}</Text>
      <Button
        t={t}
        label={tStr(lang, 'serverDown_retry')}
        onPress={onRetry}
        loading={checking}
        fullWidth={false}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    minWidth: 180,
    alignSelf: 'center',
  },
});
