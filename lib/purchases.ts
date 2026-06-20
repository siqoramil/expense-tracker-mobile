import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// The RevenueCat entitlement that unlocks premium. Must match the identifier
// configured in the RevenueCat dashboard (Entitlements → "premium").
export const ENTITLEMENT_ID = 'premium';

const extra = Constants.expoConfig?.extra as
  | { revenueCatIosKey?: string; revenueCatAndroidKey?: string }
  | undefined;

const apiKey = Platform.select({
  ios: extra?.revenueCatIosKey,
  android: extra?.revenueCatAndroidKey,
});

// Keys ship as REPLACE_WITH_* placeholders until the dashboard is wired up.
const isPlaceholderKey = (k?: string) => !k || k.startsWith('REPLACE_WITH');

let configured = false;
// True only once configure() has run against a real native module. Stays false
// before the app is rebuilt with the native SDK, so the paywall degrades to an
// "unavailable" state instead of throwing.
let available = false;

let premium = false;
type Listener = (isPremium: boolean) => void;
const listeners = new Set<Listener>();

const applyCustomerInfo = (info: CustomerInfo) => {
  const next = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  if (next !== premium) {
    premium = next;
    listeners.forEach((l) => l(premium));
  }
};

// Call once on app start. Safe to call before the native SDK is present (no-op)
// and before the API keys are filled in (no-op).
export const configurePurchases = (appUserId?: string | null) => {
  if (configured || isPlaceholderKey(apiKey)) return;
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: apiKey as string, appUserID: appUserId ?? undefined });
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    configured = true;
    available = true;
    Purchases.getCustomerInfo().then(applyCustomerInfo).catch(() => {});
  } catch {
    // Native module not linked yet (app not rebuilt) — remain unavailable.
    available = false;
  }
};

export const isPurchasesAvailable = () => available;

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  if (!available) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
};

export type PurchaseResult = 'success' | 'cancelled' | 'error';

export const purchasePackage = async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
  if (!available) return 'error';
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return 'success';
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    return 'error';
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!available) return false;
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
};

export const isPremiumNow = () => premium;

// Subscribe a React component to the live entitlement state.
export const usePremium = (): boolean => {
  const [value, setValue] = useState(premium);
  useEffect(() => {
    setValue(premium);
    const l: Listener = (v) => setValue(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return value;
};
