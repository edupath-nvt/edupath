import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Style, StatusBar } from '@capacitor/status-bar';

import { useLayoutPadding } from 'src/layouts/mobile-layout';

export async function checkStatusBarStyle(mode: 'light' | 'dark' | 'system') {
  if (!Capacitor.isNativePlatform()) {
    console.log('Chỉ chạy trên thiết bị Android/iOS');
    return;
  }

  if (mode === 'light') {
    StatusBar.setStyle({ style: Style.Light });
  }

  if (mode === 'dark') {
    StatusBar.setStyle({ style: Style.Dark });
  }

  if (mode === 'system') {
    StatusBar.setStyle({ style: Style.Default });
  }
}

export function CheckAuth({
  children,
}: React.PropsWithChildren & {
  fallback: React.ReactNode;
}) {
  const { set } = useLayoutPadding();

  useEffect(() => {
    const flatform = Capacitor.getPlatform();
    if (flatform === 'android') {
      set(5, 2);
    }
    if (flatform === 'ios') {
      set(6, 3);
    }
  }, [set]);

  return children;
}
