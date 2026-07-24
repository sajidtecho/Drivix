# Drivix Design System

## Core Brand
- **Name:** Drivix
- **Vibe:** Premium, Modern, Energetic, Trustworthy
- **Theme:** Supports both Light and Dark modes with glassmorphism effects.

## Typography
- **Primary Font:** 'Outfit', sans-serif (Google Fonts)
- **Headings:** Bold, letter-spacing: 0.5px
- **Body:** Regular/Medium, high readability

## Color Palette
- **Primary Accent:** Gold/Yellow (#FFCE00) - used for primary CTAs, active states, and highlights.
- **Secondary Accent:** Deep Orange/Gold (#FFAD00) - used for gradients and accents.
- **Accent Glow:** rgba(255, 206, 0, 0.4) - used for shadows and glow effects.
- **Background (Light):** #f5f5f7 (Primary), #f0f2f5 (Secondary), #ffffff (Tertiary)
- **Background (Dark):** #0a0a0f (Primary), #111118 (Secondary), #1a1a24 (Tertiary)
- **Text (Light):** #1a1a1a (Primary), #5a6072 (Secondary)
- **Text (Dark):** #f0f0f5 (Primary), #8a8fa8 (Secondary)

## UI Components
- **Glassmorphism:** `glass-panel` class with `backdrop-filter: blur(16px)` and subtle borders.
- **Buttons:** 
  - `btn-primary`: Gradient background (#FFCE00 to #FFAD00), black text, rounded (12px), hover lift and glow.
  - `btn-secondary`: Glass background, text color based on theme, subtle border.
- **Inputs:** Clean, with subtle borders and clear focus states using the primary accent color.
- **Cards:** Rounded (20px), subtle shadow, glass background.

## Animations
- **Transitions:** `0.3s cubic-bezier(0.4, 0, 0.2, 1)` (normal)
- **Hover Effects:** Subtle lift (translateY), background shifts, and glow intensifications.
