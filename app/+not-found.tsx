import { Redirect, Unmatched, usePathname } from 'expo-router';

export default function NotFoundScreen() {
  const pathname = usePathname();

  if (pathname.startsWith('/coin/')) {
    const symbol = pathname.split('/').filter(Boolean)[1];

    if (symbol) {
      return <Redirect href={{ pathname: '/coin' as any, params: { symbol: decodeURIComponent(symbol) } }} />;
    }
  }

  return <Unmatched />;
}
