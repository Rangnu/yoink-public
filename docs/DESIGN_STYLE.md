October 22, 2025 15:17
October 22, 2025 15:03
October 21, 2025 22:17
October 21, 2025 21:39
October 21, 2025 17:04

# Stonket Design Style Guide

## Overview
- **Theme**: Dark mode, high-contrast, neon accents
- **Mood**: Futuristic, clean, data-driven, professional
- **Brand Accent**: Green `#00C805` (rgb(0, 200, 5))
- **Object-oriented**: Use semantic color tokens (e.g., `colors.primary`, `colors.success`) instead of hardcoded hex values.

## Color System
- **Background**: `#000000`
- **Surface**: `#0B0B0B`
- **Surface Elevated**: `#121212`
- **Border**: `#1F1F1F`
- **Text (Primary)**: `#FFFFFF`
- **Text (Secondary)**: `#9E9E9E`
- **Text (Tertiary)**: `#6E6E6E`
- **Primary/Accent (Brand)**: `#00C805`
- **Accent Secondary (Optional lighter)**: `#00E676`
- **Success (Graph Up)**: `#00FF66`
- **Danger (Graph Down)**: `#FF3B30`
- **Glow (Soft)**: `rgba(0, 200, 5, 0.2)`

### Semantic Mapping (Use These Tokens)
- **Brand CTAs / Primary Buttons**: `colors.primary` bg with `colors.primaryText` text.
- **Info/Badges/Links (brand-accented)**: `colors.primary` or `colors.accent` text.
- **Gains**: `colors.success`
- **Losses**: `colors.danger`
- **Neutral text**: `colors.text`, `colors.textSecondary`, `colors.textTertiary`
- **Borders**: `colors.border`
- **Surfaces**: `colors.surface`, `colors.surfaceElevated`

Do not hardcode any green like `#00FF84`. Always reference theme tokens.

## Layout & Spacing
- **Grid**: 8pt base. Common paddings 16/20/24.
- **Corners**: 12–24px radii. Default: 12–14px.
- **Shadows/Glows**: Very soft. Prefer neutral shadows on surfaces. Use green glow sparingly on brand CTAs only when needed.

## Components

### Tabs (Bottom Navigation)
- **Icons only**, no labels.
- **Active**: icon color `colors.text` (white).
- **Inactive**: icon color `colors.tabIconDefault`.
- No underline, no gradient ring.
- **Haptics + Motion (Required)**: Tabs provide light haptic feedback and a brief animation on interaction.

#### Tab Bar Interactions & Animations

- **Press-in (immediate)**
  - Haptic: Light impact (iOS) on `onPressIn`.
  - Motion: Scale up slightly (~1.12), lift up (~-2px), tiny wiggle, then settle.
  - Implementation: `components/haptic-tab.tsx` wraps tab button children in `Animated.View` and runs a parallel sequence.

- **Focus (on activation)**
  - Motion: Scale + lift + tiny rotate once when a tab becomes focused (no loop).
  - Implementation: `app/(tabs)/_layout.tsx` uses `AnimatedTabIcon` in `tabBarIcon` for each screen.

- **Constraints**
  - Keep animations short (≈100–300ms total) and subtle. Avoid distracting loops.
  - Touch targets remain ≥ 44×44pt.
  - Colors must still reflect state: active uses `colors.text`, inactive uses `colors.tabIconDefault`.

- **Tuning**
  - Scale: 1.08–1.16
  - Lift: -2 to -3
  - Rotate: -2deg to -6deg
  - Prefer `useNativeDriver: true` for transforms.

### Segment Buttons (FOMO / Balanced / Stonky!)
- **Inactive**: `background: colors.surface`, `border: 1px colors.border`, `text: colors.text`.
- **Active**: `background: colors.primary`, `border: colors.primary`, `text: colors.primaryText` (dark text on green).
- No inner dots, no glow, no gradient outline.

### Unlock CTA (Overlay on blurred stocks)
- **Placement**: Over the blurred section (middle of locked items).
- **Style**: Flat pill. `background: colors.primary`, `text: colors.primaryText`, subtle neutral shadow.
- **Subtle aura (allowed)**: A soft pulsing aura and light glow may be used to draw attention. Keep restrained.
- **Copy**: `Unlock {N} More Stocks — {Cost} Coins • 24h Access`.

### Buttons
- **Primary**: `background: colors.primary`, `text: colors.primaryText`, subtle neutral shadow (or none), 12px radius.
- **Secondary**: `background: colors.surface`, `border: 1px colors.border`, `text: colors.text`, no glow.
- **Destructive**: `background: colors.danger` for critical actions only.

### Cards
- **Background**: `colors.surface`
- **Border**: `1px colors.border`
- **Shadow**: Neutral (subtle), avoid tinted glows by default.
- **Header/Rows**: Use `gap` 8–12, internal padding 12–16.

### Status Badges
- **Active**: `background: colors.success`, `text: colors.primaryText`.
- **Paused/Neutral**: `background: colors.border`, `text: colors.textTertiary`.
- Badges are rounded (999px), compact padding.

### Icons
- Use `IconSymbol` and theme colors (`colors.text`, `colors.primary`, `colors.accent`, `colors.textTertiary`).
- Do not introduce new hardcoded icon colors.

### Charts & Indicators
- **Up**: `colors.success`.
- **Down**: `colors.danger`.
- Avoid using brand green for trend lines to keep CTAs distinct.

## Interactions
- **Press**: `activeOpacity ~ 0.9` on touchables.
- **Haptics**: Light impact for significant actions (tab switch, unlock).
- **Animation**: Subtle, 100–200ms, no flashy overshoots.

## Accessibility
- **Contrast**: Maintain WCAG AA+ where possible (dark bg + white text).
- **Touch Targets**: ≥ 44×44pt.
- **States**: Do not use color alone—pair with shape/weight when needed (e.g., border + color).

## Do / Don’t
- **Do** use `colors.primary` for brand actions; **don’t** hardcode greens.
- **Do** use neutral shadows; **don’t** use neon glows except intentionally on primary CTAs.
- **Do** keep segments minimal; **don’t** add dots/gradients/glows.
- **Do** keep charts using success/danger colors; **don’t** mix brand green into chart signals.

## Implementation Notes
- Theme tokens live in `contexts/theme-context.tsx`.
- Tabs configured in `app/(tabs)/_layout.tsx` (icons-only, no labels).
- SegmentButtons implemented in `app/(tabs)/index.tsx` and `app/(tabs)/explore.tsx` (active = green fill/dark text).
- Avoid inline hardcoded colors; import `useTheme()` and use `colors`.

### Safe Area (Top Status Bar)
- Always use `SafeAreaView` from `react-native-safe-area-context`.
- Import:
  ```ts
  import { SafeAreaView } from 'react-native-safe-area-context';
  ```
- Wrap app root with `SafeAreaProvider`.
- For screens, set `edges={["top","left","right"]}` on `SafeAreaView` so content starts below the status bar.
- For scrollables, set `contentInsetAdjustmentBehavior="never"` to prevent underlapping the status bar.
- The UI must never overlap the top system bar (time, signal, battery) on any tab or page.

### Sticky Headers: Segments/Stats + Release After N + Markets

- **Purpose**: Provide quick segment switches (FOMO/Balanced/Stonky) and a compact stats preview (Hottest/Risk/Falling), but avoid keeping them visible too far down. After N list items (default: 5), release the sticky block so content takes over. The `Markets` header becomes sticky later when reached.

- **Structure (Home)** in `app/(tabs)/index.tsx`:
  - Header 0: AI Highlights (animated)
  - Header 1: Sticky block with
    - `segmentRow` (FOMO/Balanced/Stonky)
    - `statsPreview` (Hottest/Risk/Falling)
  - Items 2–6: First N stocks rendered as direct children
  - Header 7: Invisible release spacer `releaseStickyHeader` (height: 1, opacity: 0)
  - Items 8+: Remaining stocks inside `stocksWrapper` (includes unlock overlay when locked)
  - Header 10 or 9: `Markets` sticky header (index depends on whether the "Unlocked — 24h" note is present)

- **Sticky indices**: `stickyHeaderIndices={[1, 7, showAll ? 10 : 9]}`
  - `1`: Segments + Stats sticks initially
  - `7`: Hidden spacer; once it reaches the top, the previous sticky header is released
  - `10|9`: `Markets` header sticks when scrolled into view

- **Release spacer style**:
  - `releaseStickyHeader`: `height: 1`, `opacity: 0`

- **Adjusting N (how many items before release)**:
  - Change slices: `current.slice(0, N)` and `current.slice(N)`
  - Update spacer index to `1 + N + 1` (account for initial header and zero-based child positions)
  - Update `Markets` sticky index accordingly (offset changes if you insert notes between sections)

- **Unlock overlay**:
  - Sits within `stocksWrapper` (the remaining list), positioned around the center of the locked area.
  - Subtle pulsing glow and double chevrons are allowed to entice interaction; keep motion minimal.

- **Pull-to-refresh**:
  - Use `RefreshControl` on the ScrollView. Ensure it does not interfere with sticky indices.
  - Branded: `title="Stonket!"`, `tintColor/colors = colors.primary`, `progressBackgroundColor = colors.surface`.

### Nested Navigation Patterns (Settings / Activity / Support / About)

- **Stacks per section**: Use an Expo Router `Stack` per top-level section for clean back navigation and theming.
  - Files:
    - `app/settings/_layout.tsx`
    - `app/activity/_layout.tsx`
    - `app/activity/your-activity/_layout.tsx` (nested)
    - `app/support/_layout.tsx`
    - `app/about/_layout.tsx`
- **Theme-aware headers**:
  - `headerStyle: { backgroundColor: colors.background }`
  - `headerTintColor: colors.text`
  - `headerTitleStyle: { color: colors.text }`
- **Avoid double headers**:
  - Hide parent header for nested stacks (e.g., `your-activity`) with `options={{ headerShown: false }}` at the parent level (`app/activity/_layout.tsx`).
  - The nested stack (`app/activity/your-activity/_layout.tsx`) renders its own header.
- **Custom back (fallback)**:
  - For nested index screens that might be entered directly, provide a custom back that falls back to the parent section when no history exists.
  - Example in `app/activity/your-activity/_layout.tsx` using `HeaderBackButton` and navigating to `'/activity'` when `navigation.canGoBack()` is false.
- **Screen titles**: Set explicit `options={{ title: '...' }}` for clarity: `Appearance`, `Subscription`, `Notifications`, `Saved`, `Your Activity`, etc.

### Appearance Screen Pattern (Theme Previews + Selectors)

- **Goal**: Let users see Light/Dark/System examples before switching.
- **Implementation**: `app/settings/appearance.tsx`
  - Top row: three compact preview cards showing Light, Dark, and System palettes regardless of current theme.
  - Bottom row: three selector buttons with icons (sun/moon/gear) that set the app theme.
- **Preview card structure**:
  - Header indicators (brand primary dots), content tiles with a badge and text lines, footer label with icon.
- **Styling tokens**:
  - Use the same brand `colors.primary` inside previews; palette values inside cards are local to the card (do not affect global theme).
- **When to reuse**:
  - Any app needing a theme picker can reuse this pattern: previews first, selectors below.

### Menu Icons & Mapping (Consistent Style)

- **Icon component**: Use `IconSymbol` to render icons cross-platform via SF Symbols names mapped to Material Icons.
- **Do not** embed random Unicode emoji inside labels; keep labels text-only, icons on the left.
- **Mapping file**: `components/ui/icon-symbol.tsx`
  - Add any missing SF Symbol name to `MAPPING` with a Material Icon fallback.
  - Recently added for Menu:
    - `paintbrush.fill` → `palette`
    - `clock.fill` → `schedule`
    - `exclamationmark.bubble` → `report-problem`
    - `questionmark.circle` → `help-outline`
    - `info.circle(.fill)` → `info(-outline)`
    - `magnifyingglass` → `search`
    - `person.crop.circle` → `person`
    - `lock`/`lock.fill` → `lock`

### Back Button Consistency

- **Default back**: Prefer platform default back from the stack when possible.
- **Nested index fallback**: On nested index screens that might be entered directly, provide a `headerLeft` back that:
  - Calls `navigation.goBack()` if possible.
  - Otherwise navigates to the parent section route (e.g., `'/activity'`).
- **Spacing**: Align with platform default; if needed, adjust `HeaderBackButton` with a subtle negative left margin (e.g., `style={{ marginLeft: -8 }}`) for visual parity.
