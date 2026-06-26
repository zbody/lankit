# Design System — Lankit Admin

## Brand
- **Name**: Lankit
- **Vibe**: Clean, professional, high-contrast with subtle depth
- **Target**: B2B admin panel (Chinese enterprise)

## Color Palette

### Primary
| Token | Value | Usage |
|-------|-------|-------|
| primary | `#6366f1` | Buttons, links, active states, primary actions |
| primary-hover | `#4f46e5` | Hover states |
| primary-active | `#4338ca` | Active/pressed states |
| primary-bg | `#eef2ff` | Light background (tags, badges) |

### Neutral / Surface
| Token | Value | Usage |
|-------|-------|-------|
| sidebar-bg | `#0f172a` | Side navigation background |
| sidebar-hover | `#1e293b` | Sidebar item hover |
| sidebar-active | `#1e293b` | Sidebar selected item |
| sidebar-text | `#cbd5e1` | Sidebar label text |
| sidebar-text-active | `#ffffff` | Sidebar active item text |
| content-bg | `#f1f5f9` | Page content background |
| card-bg | `#ffffff` | Card / container background |
| header-bg | `#ffffff` | Top header background |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| text-primary | `#0f172a` | Headings, primary content |
| text-secondary | `#475569` | Body text |
| text-tertiary | `#94a3b8` | Placeholder, disabled |
| text-inverse | `#ffffff` | Text on dark backgrounds |

### Border
| Token | Value | Usage |
|-------|-------|-------|
| border | `#e2e8f0` | Default borders |
| border-secondary | `#cbd5e1` | Input borders |

### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| success | `#10b981` | Success states, active tags |
| warning | `#f59e0b` | Warning states |
| error | `#ef4444` | Error states, delete actions |
| info | `#3b82f6` | Info badges |

## Typography

### Font Family
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
```

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| xs | 12px | 400 | 1.5 | Caption, metadata |
| sm | 13px | 500 | 1.5 | Table content, form labels |
| base | 14px | 400 | 1.6 | Body text |
| lg | 16px | 500 | 1.5 | Card titles, section headers |
| xl | 20px | 600 | 1.4 | Page titles |
| 2xl | 24px | 700 | 1.35 | Hero headings |
| 3xl | 30px | 700 | 1.3 | Login page title |

## Spacing
`4px` base unit. Common values: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64`

## Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 4px | Buttons, inputs |
| radius-md | 8px | Cards, tables, modals |
| radius-lg | 12px | Login card |

## Shadows
| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | Cards |
| shadow-md | `0 4px 12px rgba(0,0,0,0.08)` | Elevated cards, dropdowns |
| shadow-lg | `0 8px 30px rgba(0,0,0,0.12)` | Login card, modals |
| sidebar-shadow | `2px 0 8px rgba(0,0,0,0.06)` | Sidebar right edge |

## Component Tokens

### Sidebar
- Width: 240px / 80px (collapsed)
- Background: `#0f172a`
- Logo area height: 64px
- Item height: 44px
- Item border radius: 8px
- Hover bg: `#1e293b`
- Active indicator: 3px left border in primary color

### Header
- Height: 56px
- Background: white
- Bottom border: 1px solid `#e2e8f0`

### Card (List pages)
- Background: white
- Border radius: 8px
- Shadow: `0 1px 2px rgba(0,0,0,0.05)`
- Header padding: 16px 24px
- Body padding: 24px

### Table
- Header bg: `#f8fafc`
- Header weight: 600
- Row hover bg: `#f8fafc`
- Border: `#f1f5f9`

### Login Page
- Background: gradient `#4f46e5 → #7c3aed → #a855f7`
- Card: white, `radius-lg`, `shadow-lg`
- Card width: 420px
- Card padding: 40px

### Buttons
- Primary: `primary` bg, `#ffffff` text
- Default: white bg, `text-primary` text, `border` border
- Border radius: 6px
- Padding: 4px 16px (default), 6px 24px (large)
