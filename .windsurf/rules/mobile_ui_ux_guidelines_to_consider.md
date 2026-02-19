---
trigger: always_on
---

October 14, 2025 16:40

# Mobile UI·UX Guidelines to Consider
---
Mobile app and web design differs significantly from desktop web design due to device characteristics and usage context.

- Mobile screens are smaller. Desktop is used seated, indoors, with large displays, supporting long, immersive tasks (e.g., Photoshop). Mobile is often used outdoors or in transit—users read news, use SNS, or play games on small screens, frequently while commuting or in cafes. This environment increases cognitive load and reduces focus. Nielsen Norman Group reports comprehension on mobile can be roughly twice as difficult as on desktop.
- Mobile lacks external input devices (mouse/keyboard). Users scroll, select, and type with fingers. Simply shrinking a desktop design for mobile is inadequate. Develop scenarios tailored to smartphone usage and reflect them in design.
- Design for one-handed use outdoors, under sunlight. Hide or remove nonessential/low-priority features. Simplify navigation; avoid deep hierarchies.
- Mobile-first is now common. However, balancing desktop and mobile often makes it hard to honor mobile’s constraints. Treat platform HIGs as guides rather than strict laws; prioritize consistency and usability.

This guideline compiles 50 considerations across five parts. Use them as practical references, not absolute rules.

---

## 1) Dialogs, Alerts, Buttons, and Inputs

1. Do not show a top-right X (close) on mobile alert dialogs.
   - X duplicates the Confirm/Cancel actions already provided below.
   - Close actions on mobile perform better at the bottom than at top-right.

2. In full-screen dialogs, place the X (Close/Cancel) at the top-left.
   - Both iOS and Android place navigation controls (hamburger/back) on the left side of the top bar. For modal input flows, place Close/Cancel on the left and Confirm on the right to preserve consistency and avoid keyboard obstruction.

3. Place positive actions on the right.
   - On mobile dialogs/alerts, positive actions (e.g., OK/Confirm) are placed on the right, negative actions (e.g., Cancel) on the left. iOS and modern Android converge on this for consistency and to align with real-world metaphors of advancing to the right.

4. Disable the submit/complete button until required inputs are valid.
   - To prevent errors, keep actions like Send/Login disabled until all required fields are satisfied.

5. Provide appropriate keyboards for each input field.
   - Phone fields: numeric keypad.
   - Search fields: show the Search action on the keyboard.
   - Email fields: keyboard with '@' convenience.
   - Inconsistent keyboards increase friction and errors.

6. Avoid a separate search button to the right of the search field.
   - Prefer relying on the keyboard’s Search action for better usability (even when the field is below the navigation bar).

7. Don’t align a content grid exactly to the bottom edge; hint that more content exists.
   - Users scroll less than designers think. Provide visual cues (e.g., overflow) to indicate content continues below.

8. Avoid nested/multi-row tabs.
   - Tabs organize related content at the same level. If tabs overflow one row, reduce items (max 5) or allow horizontal scroll instead of stacking multiple rows.

9. Use button styles according to importance.
   - Establish visual hierarchy. Do not style different-purpose buttons the same. Make the most-used CTA larger/more prominent than secondary actions.

10. Minimize visual noise.
   - Limit colors, increase whitespace, and reduce nonfunctional borders/lines. Group related information to clarify hierarchy and reduce complexity.

11. Do not rely on color alone to show state (selected/active).
   - Support with shape/outline/indicator changes so colorblind/low-vision users can perceive state.

12. For full-screen input dialogs with keyboards, place Done/Complete on the top-right.
   - Bottom actions can be covered by the keyboard; ensure completion is possible without dismissing the keyboard.

---

## 2) Forms, Validation, Proximity, and Clear Actions

13. For login/sign-up, provide a show/hide password toggle.
   - Mobile typing is error-prone; toggling visibility reduces mistakes and recovery time.

14. Place related elements close together (Proximity).
   - Adjust spacing to improve readability and quick recognition.

15. Provide real-time validation feedback.
   - Validate as the user types to reduce post-submit errors. Avoid alerting errors only after form submission.

16. Do not reuse button styling for non-button elements (like section titles).
   - Preserve CTA distinctiveness for conversion and clarity.

17. Use a stepper for quantity selection instead of a dropdown.
   - Reduces errors and improves efficiency for small integer adjustments (e.g., cart quantity).

18. Provide a Clear button in text fields.
   - Erasing is as important as typing on mobile; make clearing text a single tap.

19. Consider alternatives to traditional radio buttons for option selection.
   - Depending on context, segmented controls, toggles, or steppers may be more usable.

20. Keep completion actions disabled until required options are selected.
   - If a dropdown must be used, prevent premature activation (e.g., Buy Now) until a valid choice is made.

21. For binary choices like Yes/No, use a single checkbox or a toggle switch.
   - Prefer “Agree” checkbox instead of separate Yes/No radios.

22. Important action buttons must not be obscured by the keyboard.
   - If many fields push the submit button below the fold, move the primary action to the top-right or ensure it remains visible.

23. Design one primary action per screen.
   - Split complex processes into multiple steps to reduce cognitive load, improve performance, and increase completion rates.

24. Horizontally sliding content doesn’t need to snap exactly to the grid.
   - Use partial peek (cut-off) to signal more items are available via horizontal swipe; avoid dot pagination where space is tight.

25. Prefer modal sheets over modal windows on mobile.
   - Sheets slide up from the bottom, provide more layout flexibility, and are easier to reach one-handed.

---

## 3) Options, Navigation Elements, and Persistent CTAs

26. Do not use radio buttons for sorting.
   - Radio buttons are for mutually exclusive selection only; use segmented controls or tabs if selecting triggers immediate state changes.

27. Do not nest additional options inside a radio option.
   - Avoid radio-in-radio or embedding inputs; keep each option to a single selection level. Use switches/toggles for sub-states if needed.

28. Do not underline link text in mobile apps.
   - Treat navigations as buttons; reserve underlines for web content where needed.

29. If there are five or fewer options, expose them instead of using a dropdown.
   - Dropdowns are better when options exceed ~7. With just two sorting options, a dropdown harms usability.

30. Limit tab bar items to a maximum of five.
   - If more destinations are needed, use a More overflow pattern.

31. Use text-only buttons (no borders/fills) in alerts.
   - Reserve filled/bordered CTA buttons for highly important actions (e.g., landing page conversion).

32. (Reserved)

33. Keep critical CTAs persistently visible while scrolling.
   - E.g., on a product detail page, show Add to Cart/Buy Now persistently for higher conversion.

---

## 4) Content First, Error Prevention, and Deletion Safety

34. Navigation and UI controls must not overshadow content.
   - Navigation is a means, not the end. Minimize nav prominence on content/detail pages so users can focus on reading.

35. For irreversible actions (e.g., delete), ask for confirmation.
   - Deleting is costly to undo; request explicit confirmation to prevent accidental loss.

36. Make user-generated or user-assembled information hard to delete accidentally.
   - Use soft-delete or multi-step delete patterns (edit mode, move to trash, etc.). Provide undo where possible.

37. Do not add separate select/execute buttons inside list rows when tapping the row triggers the primary action.
   - Place only secondary actions (e.g., Edit) on the right if needed; tapping the item should execute the main action directly.

38. Separate primary and destructive/secondary actions spatially.
   - Avoid placing Delete/Remove next to Purchase/Confirm; keep the primary CTA dominant and isolated from destructive actions.

39. Use at least 150% line height for body text.
   - Mobile readability suffers versus desktop; increase line-height (~1.5–1.6). For Korean, even wider leading may be necessary (e.g., 16pt size → 24pt+ line height).

40. Avoid overloading the navigation bar with controls.
   - On content/detail pages, include only the title, back, and context-appropriate controls. Avoid layered/stacked nav bars.

---

## 5) Back Navigation, Breadcrumbs, Alignment, and States

41. Provide only one back button per screen.
   - Avoid duplicating navigation in both top nav bar and bottom tab bar.

42. Avoid duplicating navigation elements in the top bar.
   - If Back is on the left, the right side should host page-level controls (Edit/Done/Share), not another nav element—unless breaking guidelines is a deliberate UX strategy.

43. The label next to the Back arrow is the previous screen name.
   - The current screen title belongs in the center (iOS convention) to avoid confusion.

44. Do not use breadcrumbs on mobile.
   - Simplify information architecture so breadcrumbs aren’t necessary. Reduce depth and minimize navigation elements.

45. Top buttons may be unnecessary on mobile.
   - If used, consider showing only when the user scrolls up or pauses; do not show while scrolling down.

46. Avoid center-aligned body text for readability.
   - Users scan in F-pattern; left-aligned text eases scanning by keeping starting positions consistent. Avoid center alignment for long-form content, especially on-the-go.

47. Do not use the same color for disabled and enabled elements.
   - Disabled items should look clearly inactive; prefer a distinct color or sufficient contrast change, not just opacity tweaks.

48. Button labels must describe the action, not generic Yes/No.
   - Labels should be clear and predictable, reflecting the user’s intended action (e.g., Transfer, Submit) rather than Yes/No.

---

## Human Interface Guidelines

- **Clarity, Deference, Depth**: Make content primary; use subtle UI, clear hierarchy, and purposeful motion.
- **Safe Areas & Reach**: Respect safe areas; keep primary actions reachable (bottom or top-right when keyboard is up).
- **Navigation Patterns**: Prefer tab bar (≤5 items) for top-level destinations; use navigation bars for hierarchy with a single clear Back.
- **Bars & Titles**: Center current title; Back on left with previous title label; place contextual actions on the right.
- **Controls & Targets**: Minimum 44×44 pt hit areas; maintain sufficient spacing to prevent accidental taps.
- **Gestures & Discoverability**: Support common gestures (swipe, pull-to-refresh) but never hide critical actions behind gestures alone.
- **Feedback & Affordance**: Provide immediate visual feedback on interaction and loading; use skeletons or progress indicators when needed.
- **Modality**: Prefer sheets for transient tasks; use alerts sparingly and with descriptive action labels.
- **Typography**: Use Dynamic Type where applicable; maintain comfortable line heights (~1.5–1.6) and adequate contrast.
- **Color & States**: Do not rely on color alone; ensure accessible contrast, distinct disabled styles, and clear selection indicators.
- **Icons & Language**: Use familiar SF Symbols/icons and concise, action-oriented labels.
- **Adaptivity**: Support Dark Mode, different sizes/orientations, and multitasking where relevant.
- **Motion & Haptics**: Use subtle, meaningful transitions and haptic feedback to confirm key actions without distraction.