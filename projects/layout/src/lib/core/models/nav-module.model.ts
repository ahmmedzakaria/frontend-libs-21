export type NavCategory = 'Operation' | 'Setup' | 'Report';

export interface NavItem {
  label: string;
  /** Route path this item navigates to, relative to the module's base route. */
  path?: string;
  icon?: string;
}

export interface NavModule {
  id: string;
  label: string;
  path?: string;
  /** Name used to look up this module's icon in the icon registry. */
  icon: string;
  categories: Partial<Record<NavCategory, NavItem[]>>;
}

export const NAV_MODULES: NavModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    categories: {
      Operation: [
        { label: 'Overview', path: 'overview' },
        { label: 'Tasks', path: 'tasks' }
      ]
    }
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'users',
    categories: {
      Operation: [
        { label: 'List', path: 'list' },
        { label: 'New', path: 'new' },
        { label: 'Import', path: 'import' }
      ],
      Setup: [
        { label: 'Groups', path: 'groups' },
        { label: 'Blacklist', path: 'blacklist' },
        { label: 'Merge', path: 'merge' }
      ],
      Report: [
        { label: 'Export', path: 'export' },
        { label: 'Archive', path: 'archive' }
      ]
    }
  },
  {
    id: 'kyc',
    label: 'KYC',
    icon: 'id-card',
    categories: {
      Operation: [
        { label: 'New', path: 'new' },
        { label: 'Pending', path: 'pending' },
        { label: 'Review', path: 'review' }
      ],
      Setup: [{ label: 'Workflow', path: 'workflow' }],
      Report: [
        { label: 'Approved', path: 'approved' },
        { label: 'Rejected', path: 'rejected' },
        { label: 'History', path: 'history' }
      ]
    }
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'gear',
    categories: {
      Operation: [
        { label: 'Users', path: 'users' },
        { label: 'Roles', path: 'roles' },
        { label: 'Permissions', path: 'permissions' }
      ],
      Setup: [
        { label: 'API', path: 'api' },
        { label: 'Themes', path: 'themes' },
        { label: 'Backup', path: 'backup' }
      ],
      Report: [{ label: 'Jobs', path: 'jobs' }]
    }
  }
];
