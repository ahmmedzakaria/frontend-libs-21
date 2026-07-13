/**
 * Raw <path>/<circle> markup for each icon, ported 1:1 from the original SVG set.
 * Every icon uses stroke="currentColor" so it inherits the active theme's accent
 * automatically — this is the reason we ported these rather than pulling in
 * Font Awesome, which ships fixed-weight, fixed-style glyphs that ignore theming.
 */
export const ICONS: Record<string, string> = {
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" stroke-linecap="round" stroke-linejoin="round"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5" stroke-linecap="round"/><circle cx="17" cy="9" r="2.3"/><path d="M15.8 14.2c2.2.4 3.6 2 4 5.3" stroke-linecap="round"/>',
  'id-card': '<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="8.5" cy="12" r="2"/><path d="M13 11h5M13 14h5" stroke-linecap="round"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5c.1-.5.1-1 0-1.5l1.7-1.3-1.5-2.6-2 .6a6.4 6.4 0 00-1.3-.8l-.3-2.1H10l-.3 2.1c-.5.2-.9.5-1.3.8l-2-.6-1.5 2.6 1.7 1.3c-.1.5-.1 1 0 1.5L5 14.8l1.5 2.6 2-.6c.4.3.8.6 1.3.8l.3 2.1h4l.3-2.1c.5-.2.9-.5 1.3-.8l2 .6 1.5-2.6-1.7-1.3z" stroke-linecap="round" stroke-linejoin="round"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" stroke-linejoin="round" stroke-linecap="round"/>',
  'bar-chart': '<path d="M4 20V11M10 20V4M16 20v-7" stroke-linecap="round"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.7 21a2 2 0 01-3.4 0" stroke-linecap="round"/>',
  clipboard: '<rect x="7" y="3" width="10" height="4" rx="1"/><path d="M7 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke-linecap="round"/>',
  building: '<path d="M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15M4 21h16M12 21v-6h4a1 1 0 011 1v5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 9h.01M8 12.5h.01M8 16h.01" stroke-linecap="round"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke-linecap="round"/>',
  moon: '<path d="M21 12.5A9 9 0 1111.5 3a7 7 0 009.5 9.5z" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  hamburger: '<path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>',
  grid: '<circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/>',
  folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke-linejoin="round"/>',
  document: '<path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke-linejoin="round"/><path d="M14 2v5h5" stroke-linejoin="round"/>',
  percent: '<circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/><path d="M18 6L6 18" stroke-linecap="round"/>',
  trend: '<path d="M3 17l5-5 4 4 8-9" stroke-linecap="round" stroke-linejoin="round"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 115 .5c0 1.5-2 1.8-2 3.3" stroke-linecap="round"/><circle cx="12" cy="17.3" r=".9" fill="currentColor" stroke="none"/>'
};
