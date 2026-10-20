/**
 * Phone-maker wording for the autostart / background step (report #2). Battery
 * managers on these phones stop apps "even when everything looks set up", which is
 * the main way protection fails silently.
 */
export function oemStep(manufacturer: string) {
  switch (manufacturer) {
    case 'samsung':
      return { title: 'Samsung battery settings', why: 'Add Littlegate to “Never sleeping apps” so the phone never stops it.' };
    case 'xiaomi':
    case 'redmi':
    case 'poco':
      return { title: 'Xiaomi Autostart', why: 'Turn on Autostart for Littlegate so the phone never stops it.' };
    case 'huawei':
    case 'honor':
      return { title: 'App launch', why: 'Set Littlegate to “Manage manually” and leave every switch on.' };
    default:
      return { title: 'Auto-launch', why: 'Allow Littlegate to start on its own so the phone never stops it.' };
  }
}
