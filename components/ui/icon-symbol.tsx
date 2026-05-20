// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle, Text } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Tab icons
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'line.3.horizontal.decrease.circle': 'filter-list',
  'bookmark.fill': 'bookmark',
  'bookmark': 'bookmark-border',
  'ellipsis.circle': 'more-horiz',
  
  // Common icons
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.down': 'expand-more',
  'chevron.left': 'chevron-left',
  'lock.fill': 'lock',
  'lock.open.fill': 'lock-open',
  'creditcard': 'credit-card',
  'play.rectangle.fill': 'play-arrow',
  'checkmark.seal.fill': 'verified',
  'plus.circle.fill': 'add-circle',
  'scope': 'search',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'chart.line.downtrend.xyaxis': 'trending-down',
  'pencil': 'edit',
  'play.fill': 'play-arrow',
  'list.bullet.rectangle': 'list',
  'person.fill': 'person',
  'ellipsis': 'more-vert',
  'ellipsis.vertical': 'more-vert',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'bubble.left': 'chat-bubble-outline',
  'text.bubble.fill': 'chat-bubble',
  'bookmark.slash': 'bookmark-remove',
  'arrow.2.squarepath': 'repeat',
  'square.and.arrow.up': 'share',
  'moon.fill': 'nightlight',
  'sun.max.fill': 'wb-sunny',
  'sparkles': 'auto-awesome',
  'cube': 'category',
  'arrow.triangle.2.circlepath': 'sync',
  'dollarsign.circle': 'attach-money',
  'eurosign.circle': 'euro',
  // Material Icons does not include a dedicated KRW (won) glyph; use yen as a nearest currency symbol.
  'wonsign.circle': 'currency-yen',
  'wonsign.circle.fill': 'currency-yen',
  'yensign.circle': 'currency-yen',
  'yensign.circle.fill': 'currency-yuan',
  'dollarsign.circle.fill': 'paid',
  'bitcoinsign.circle': 'currency-bitcoin',
  'doc.text': 'description',
  'gearshape.fill': 'settings',
  'gift.fill': 'card-giftcard',
  'bell.fill': 'notifications',
  'line.3.horizontal': 'drag-handle',
  'eye.fill': 'visibility',
  // Newly added mappings for menu & headers
  'paintbrush.fill': 'palette',
  'clock.fill': 'schedule',
  'exclamationmark.bubble': 'report-problem',
  'questionmark.circle': 'help-outline',
  'info.circle': 'info-outline',
  'info.circle.fill': 'info',
  'magnifyingglass': 'search',
  'person.crop.circle': 'person',
  'lock': 'lock',
  // Explore tab & categories
  'globe': 'public',
  'building.columns': 'account-balance',
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  if (name === 'wonsign.circle' || name === 'wonsign.circle.fill') {
    return <Text style={[{ color, fontSize: size }, style as any]}>₩</Text>;
  }
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
