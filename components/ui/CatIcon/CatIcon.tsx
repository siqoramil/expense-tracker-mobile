import { View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { type Category, useStoreSelector } from '@/lib/store';

export const CatIcon = ({ cat, size = 40 }: { cat: string; size?: number }) => {
  const c = useStoreSelector<Category | undefined>(
    (s) => s.categories.find((x) => x.id === cat),
    (a, b) => a?.id === b?.id && a?.color === b?.color && a?.icon === b?.icon,
  );
  if (!c) return <View style={{ width: size, height: size }} />;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.5,
        backgroundColor: c.color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={c.icon as IconName} size={size * 0.5} color={c.color} stroke={2} />
    </View>
  );
};
