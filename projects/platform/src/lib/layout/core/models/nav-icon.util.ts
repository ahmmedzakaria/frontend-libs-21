/**
 * Keyword-heuristic icon lookup for backend nav-tree nodes at any depth (Module
 * Group/Module/Category/Feature Group rows, plus flat-mode leaf items) — the
 * backend sends free-text `label`s and an optional `icon` hint, never a
 * registry-matched icon name, so this maps both onto one of icon-registry.ts's
 * names. Mirrors sentinel-kyc-angular-cld's moduleIcon()/categoryIcon() split,
 * collapsed into one function since our tree has no fixed category vocabulary
 * (Operation/Setup/Report) to special-case.
 */
export function resolveNavIcon(icon: string | undefined, label: string): string {
  const source = `${icon || ''} ${label}`.toLowerCase();

  if (source.includes('dashboard') || source.includes('home')) return 'home';
  if (source.includes('person') || source.includes('user') || source.includes('customer')) return 'users';
  if (source.includes('kyc') || source.includes('id-card') || source.includes('id card')) return 'id-card';
  if (source.includes('setup') || source.includes('setting') || source.includes('gear') || source.includes('cog')) return 'gear';
  if (source.includes('report') || source.includes('chart') || source.includes('table')) return 'bar-chart';
  if (source.includes('search') || source.includes('list')) return 'search';
  if (source.includes('document') || source.includes('file')) return 'document';
  if (source.includes('folder')) return 'folder';

  return 'help';
}
