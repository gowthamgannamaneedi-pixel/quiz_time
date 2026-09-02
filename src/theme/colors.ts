/**
 * Official NIAT Advance Tech Club - Premium Light Theme Palette
 * 80% White / Light Neutral, 15% Dark High-Contrast Typography, 5% Deep Burgundy & Red Brand Accents
 */
export const theme = {
  // 1. Page Backgrounds & Surfaces (80% Visual Weight)
  brandBackground: '#F7F8FA',     // Main clean light page background (very light warm gray)
  brandSurface: '#FFFFFF',        // Pure white card and container surface
  brandSurfaceLight: '#F2F4F7',   // Subtle neutral background for input fields, stat pills & badges
  brandSurfaceHover: '#FBEAEB',   // Ultra soft burgundy tint on hover/active
  white: '#FFFFFF',

  // 2. High-Contrast Typography & Neutral Borders (15% Visual Weight)
  brandText: '#151923',           // Dark high-contrast primary text for questions, titles, and numbers
  brandTextSecondary: '#667085',  // Crisp secondary text for descriptions, timer labels, subtitles
  brandTextMuted: '#98A2B3',      // Subtle muted placeholder text
  brandBorder: '#E4E7EC',         // Clean subtle border for cards, inputs, and dividers
  brandBorderLight: '#F2F4F7',    // Very soft border for inner sections

  // 3. Official NIAT Brand Accents (5% Visual Weight)
  brandBurgundy: '#800D15',       // Deep burgundy from the logo (Primary CTA button, key headings)
  brandBurgundyHover: '#660A11',  // Slightly darker burgundy for pressed buttons
  brandBurgundyLight: '#FDF2F2',  // Soft burgundy/red tint for selected option cards & badges
  brandBurgundyBorder: '#ECC0C2', // Soft burgundy border for selected states
  brandPrimary: '#800D15',        // Main primary action color (Deep Burgundy)
  brandPrimaryLight: '#9E1B23',   // Medium burgundy
  brandPrimaryDark: '#5E060C',    // Deep dark burgundy
  brandPrimaryMuted: '#FDF2F2',   // Muted tint for badges
  brandBorderRed: '#ECC0C2',      // Subtle red border

  // 4. Vibrant Red Accent (Scanner, Live tags, Low time warning)
  brandAccent: '#E62B32',         // Vibrant logo red accent (Scanner CTA, <5s Timer, Live badge)
  brandAccentHover: '#C91D24',

  // 5. Semantic Colors (Status, Success, Danger, Leaderboard Gold)
  success: '#12B76A',             // Clean emerald green for correct answers & live status
  successSurface: '#ECFDF3',      // Emerald tint background
  successBorder: '#A6F4C5',       // Emerald soft border
  successText: '#027A48',         // High contrast green text

  danger: '#D92D20',              // Crimson red for wrong answers & force end quiz
  dangerSurface: '#FEF3F2',       // Red tint background
  dangerBorder: '#FECDCA',        // Red soft border
  dangerText: '#B42318',          // High contrast red text

  warning: '#F79009',             // Amber warning
  warningSurface: '#FFFAEB',      // Amber tint background
  warningBorder: '#FEDF89',
  warningText: '#B54708',

  brandGold: '#D97706',           // Gold trophy & #1 leaderboard medal
  brandGoldSurface: '#FEF3C7',    // Gold medal pill background
  brandGoldBorder: '#FDE68A',     // Gold border
  brandGoldLight: '#B45309',      // Gold icon & text highlight
  brandGoldText: '#92400E',       // Gold rank text
};
