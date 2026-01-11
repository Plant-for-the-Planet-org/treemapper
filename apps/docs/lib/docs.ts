export interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  title: string;
  href: string;
  items?: DocItem[];
}

export const docsConfig: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        id: 'introduction',
        title: 'Introduction',
        href: '/docs/introduction',
      },
      {
        id: 'mobile-setup',
        title: 'Mobile App Setup',
        href: '/docs/mobile-setup',
      },
      {
        id: 'web-setup',
        title: 'Web Dashboard Setup',
        href: '/docs/web-setup',
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        href: '/docs/quick-start',
      },
    ],
  },
  {
    id: 'tutorials',
    title: 'Interactive Tutorials',
    items: [
      {
        id: 'first-intervention',
        title: 'Creating Your First Intervention',
        href: '/docs/tutorials/first-intervention',
      },
      {
        id: 'monitoring-plots',
        title: 'Setting Up Monitoring Plots',
        href: '/docs/tutorials/monitoring-plots',
      },
      {
        id: 'managing-species',
        title: 'Managing Tree Species',
        href: '/docs/tutorials/managing-species',
      },
      {
        id: 'working-offline',
        title: 'Working Offline',
        href: '/docs/tutorials/working-offline',
      },
      {
        id: 'team-collaboration',
        title: 'Team Collaboration',
        href: '/docs/tutorials/team-collaboration',
      },
      {
        id: 'analytics-reporting',
        title: 'Analytics & Reporting',
        href: '/docs/tutorials/analytics-reporting',
      },
    ],
  },
  {
    id: 'key-concepts',
    title: 'Key Concepts',
    items: [
      {
        id: 'interventions',
        title: 'Understanding Interventions',
        href: '/docs/concepts/interventions',
      },
      {
        id: 'plots',
        title: 'Plots & Plot Groups',
        href: '/docs/concepts/plots',
      },
      {
        id: 'projects-sites',
        title: 'Projects vs Sites',
        href: '/docs/concepts/projects-sites',
      },
      {
        id: 'sync-offline',
        title: 'Sync & Offline Mode',
        href: '/docs/concepts/sync-offline',
      },
      {
        id: 'data-export',
        title: 'Data Export',
        href: '/docs/concepts/data-export',
      },
      {
        id: 'species-database',
        title: 'Species Database',
        href: '/docs/concepts/species-database',
      },
    ],
  },
  {
    id: 'mobile-features',
    title: 'Mobile Features',
    items: [
      {
        id: 'map-navigation',
        title: 'Map Navigation',
        href: '/docs/mobile/map-navigation',
      },
      {
        id: 'creating-interventions',
        title: 'Creating Interventions',
        href: '/docs/mobile/creating-interventions',
      },
      {
        id: 'plot-management',
        title: 'Plot Management',
        href: '/docs/mobile/plot-management',
      },
      {
        id: 'measurements',
        title: 'Taking Measurements',
        href: '/docs/mobile/measurements',
      },
      {
        id: 'photo-documentation',
        title: 'Photo Documentation',
        href: '/docs/mobile/photo-documentation',
      },
      {
        id: 'offline-maps',
        title: 'Offline Maps',
        href: '/docs/mobile/offline-maps',
      },
    ],
  },
  {
    id: 'web-features',
    title: 'Web Dashboard',
    items: [
      {
        id: 'overview',
        title: 'Dashboard Overview',
        href: '/docs/web/overview',
      },
      {
        id: 'sites-management',
        title: 'Managing Sites',
        href: '/docs/web/sites-management',
      },
      {
        id: 'bulk-upload',
        title: 'Bulk Data Upload',
        href: '/docs/web/bulk-upload',
      },
      {
        id: 'team-management',
        title: 'Team Management',
        href: '/docs/web/team-management',
      },
      {
        id: 'species-management',
        title: 'Species Management',
        href: '/docs/web/species-management',
      },
      {
        id: 'reports',
        title: 'Reports & Analytics',
        href: '/docs/web/reports',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Help & Support',
    items: [
      {
        id: 'faq',
        title: 'FAQs',
        href: '/docs/faq',
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        href: '/docs/troubleshooting',
      },
      {
        id: 'common-issues',
        title: 'Common Issues',
        href: '/docs/common-issues',
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        href: '/docs/contact-support',
      },
    ],
  },
];
