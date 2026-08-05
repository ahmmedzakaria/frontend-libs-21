import { ICONS } from '../../shared/icon/icon-registry';
import { NavTreeItem } from './layout-config.model';

/**
 * Icon lookup for backend nav-tree nodes at any depth (Module Group/Module/
 * Category/Feature Group rows, plus flat-mode leaf items). Backend nodes now
 * carry a level-specific registry-matched icon name — `moduleGroupIconName`
 * on `type: 'group'` nodes, `moduleIconName` on `type: 'module'` nodes — which
 * takes priority when it's an exact hit in icon-registry.ts's `ICONS` map.
 * Falls back to the older keyword heuristic against the generic `icon` field
 * plus free-text `label` for nodes/depths the backend doesn't assign a
 * specific icon name to (Category, Feature Group, Feature) or for any name
 * that isn't (yet) a registered icon — this keeps an unrecognized backend
 * icon name from silently rendering blank (see `IconComponent`'s `ICONS[name]
 * ?? ''` fallback). Mirrors sentinel-kyc-angular-cld's moduleIcon()/
 * categoryIcon() split, collapsed into one function since our tree has no
 * fixed category vocabulary (Operation/Setup/Report) to special-case.
 */
export function resolveNavIcon(node: Pick<NavTreeItem, 'icon' | 'label' | 'moduleGroupIconName' | 'moduleIconName'> | null | undefined): string {
  if (!node) {
    return 'help';
  }

  const preferred = node.moduleGroupIconName || node.moduleIconName || node.icon;
  if (preferred && preferred in ICONS) {
    return preferred;
  }

  const source = `${preferred || ''} ${node.label}`.toLowerCase();

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
