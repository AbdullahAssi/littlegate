# Littlegate — Logo Guidelines

## 1. The logo
- **Idea:** an open arch with a child inside it: the safe side of a little gate. It shows protection without a shield, a padlock or an eye.
- **Construction:** the arch's stroke is exactly as thick as the stem of the Fredoka SemiBold **l**, so the mark and the name share one weight. The arch's legs end in round caps that echo Fredoka's round letter ends.
- **Versions:**

| Version | File | Use for |
|---|---|---|
| Horizontal (primary) | `littlegate-horizontal.svg` | Website header, store listing, documents |
| Stacked | `littlegate-stacked.svg` | Square spaces: splash, social posts, merch |
| Symbol | `littlegate-symbol.svg` | App icon, avatars; the mark on its own |
| Symbol, small sizes | `littlegate-symbol-small.svg` | 32 px and below (favicon, notification icon) |
| Symbol, reversed | `littlegate-symbol-reversed.svg` | Light symbol on dark backgrounds (slightly thinner) |
| Wordmark | `littlegate-wordmark.svg` | Only where the symbol already appears nearby |

Every lockup also comes in `-dark`, `-black` and `-white` files. One-colour and PNG exports are in `variants/`.

## 2. Clear space
Keep empty space around the logo equal to **one dot**: the diameter of the circle inside the arch. Measure the dot at the size you are using the logo; never use a fixed distance.

## 3. Minimum size
| Version | Screen | Print |
|---|---|---|
| Horizontal | 110 px wide | 25 mm wide |
| Stacked | 80 px wide | 18 mm wide |
| Symbol | 16 px (use the **small** file at 32 px and below) | 6 mm |

## 4. Colour
| Name | Role | HEX | RGB | CMYK (approx.) |
|---|---|---|---|---|
| **Iris** | Symbol, brand tiles | `#4E3FD6` | 78 63 214 | 64 71 0 16 |
| **Ink** | Wordmark | `#221F2B` | 34 31 43 | 21 28 0 83 |
| **Iris Light** | Symbol on dark | `#A99CFF` | 169 156 255 | 34 39 0 0 |
| **Paper** | Wordmark on dark | `#F1F0F6` | 241 240 246 | 2 2 0 4 |
| **Lilac** | Soft background tint | `#D9D3FB` | 217 211 251 | 14 16 0 2 |

The CMYK values are straight conversions, not print-matched. Have the printer proof them, and pick a Pantone from a physical swatch book.

**Approved logo and background pairs** (WCAG contrast):
- Full colour on white or Mist `#ECECF1`: Iris 7.0 : 1 / 5.9 : 1
- White symbol on Iris: 7.0 : 1 (app icon, merch)
- Dark files (Iris Light + Paper) on `#121117`: 8.0 : 1
- Iris on Lilac: 4.9 : 1 (passes AA)
- **Not allowed:** Iris on near-black (2.7 : 1). Use the `-dark` files instead.

## 5. Typography
- **Logo:** Fredoka SemiBold (weight 600), already converted to outlines inside the files. Never retype the name in place of the logo.
- **App UI:** Figtree 400/500/600 (unchanged).
- **Licence:** both fonts are under the SIL Open Font License, which allows logo and commercial use. A copy of Fredoka is in `branding/fonts/`.

## 6. App icon (Android / Expo)
The files in `app-icons/` use the same names as the fields in `mobile/app.json`:
- `android-icon-foreground.png`: white arch, sized to fit Android's 66 dp safe zone.
- `android-icon-background.png`: solid Iris; set `adaptiveIcon.backgroundColor` to `#4E3FD6`.
- `android-icon-monochrome.png`: one-colour version for Android 13+ themed icons.
- `icon.png`: full-bleed Iris square with the white mark.
- `splash-icon.png` / `splash-icon-dark.png`: Iris mark for light splash screens, Iris Light for dark.
- `notification-icon.png`: white small-size arch on transparent, 96 px (24 dp xxxhdpi) for the status bar, e.g. the VPN service notification.

## 7. Don'ts
- Don't stretch, squash or rotate the logo.
- Don't recolour it outside this palette, and don't add shadows, outlines, gradients or effects.
- Don't move the dot, close the arch, or change the arch's thickness.
- Don't resize or rearrange the parts of a lockup.
- Don't place the logo on busy photos without a solid container.

## 8. Before launch
- **Trademark:** "Littlegate" and the mark have not been legally cleared. Run a USPTO search (classes 9 and 42), plus EUIPO or your local office.
- **Master files:** `branding/logo/final/`. To regenerate everything, run `build_wordmark.py`, then `build_kit.py`.
