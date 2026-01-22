export interface DocSection {
  id: string;
  title: string;
  titleKey: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  title: string;
  titleKey: string;
  href: string;
  items?: DocItem[];
}

export const docsConfig: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    titleKey: 'gettingStarted',
    items: [
      {
        id: 'introduction',
        title: 'Introduction',
        titleKey: 'introduction',
        href: '/docs/introduction',
      },
      {
        id: 'mobile-setup',
        title: 'Mobile Setup',
        titleKey: 'mobileSetup',
        href: '/docs/mobile-setup',
      },
      {
        id: 'web-setup',
        title: 'Web Setup',
        titleKey: 'webSetup',
        href: '/docs/web-setup',
      },
      {
        id: 'quick-start',
        title: 'Quick Start',
        titleKey: 'quickStart',
        href: '/docs/quick-start',
      },
    ],
  },
  {
    id: 'tutorials',
    title: 'Tutorials',
    titleKey: 'tutorials',
    items: [
      {
        id: 'first-intervention',
        title: 'First Intervention',
        titleKey: 'firstIntervention',
        href: '/docs/tutorials/first-intervention',
      },
      {
        id: 'project-creation',
        title: 'Project Creation',
        titleKey: 'projectCreation',
        href: '/docs/tutorials/project-creation',
      },
      {
        id: 'site-creation',
        title: 'Site Creation',
        titleKey: 'siteCreation',
        href: '/docs/tutorials/site-creation',
      },
      {
        id: 'monitoring-plots',
        title: 'Monitoring Plots',
        titleKey: 'monitoringPlots',
        href: '/docs/tutorials/monitoring-plots',
      },
      {
        id: 'managing-species',
        title: 'Managing Species',
        titleKey: 'managingSpecies',
        href: '/docs/tutorials/managing-species',
      },
      {
        id: 'working-offline',
        title: 'Working Offline',
        titleKey: 'workingOffline',
        href: '/docs/tutorials/working-offline',
      },
      {
        id: 'team-collaboration',
        title: 'Team Collaboration',
        titleKey: 'teamCollaboration',
        href: '/docs/tutorials/team-collaboration',
      },
      {
        id: 'analytics-reporting',
        title: 'Analytics & Reporting',
        titleKey: 'analyticsReporting',
        href: '/docs/tutorials/analytics-reporting',
      },
    ],
  },
  {
    id: 'key-concepts',
    title: 'Key Concepts',
    titleKey: 'keyConcepts',
    items: [
      {
        id: 'interventions',
        title: 'Interventions',
        titleKey: 'interventions',
        href: '/docs/concepts/interventions',
      },
      {
        id: 'plots',
        title: 'Plots',
        titleKey: 'plots',
        href: '/docs/concepts/plots',
      },
      {
        id: 'projects-sites',
        title: 'Projects & Sites',
        titleKey: 'projectsSites',
        href: '/docs/concepts/projects-sites',
      },
      {
        id: 'sync-offline',
        title: 'Sync & Offline',
        titleKey: 'syncOffline',
        href: '/docs/concepts/sync-offline',
      },
      {
        id: 'data-export',
        title: 'Data Export',
        titleKey: 'dataExport',
        href: '/docs/concepts/data-export',
      },
      {
        id: 'remeasurement',
        title: 'Remeasurement',
        titleKey: 'remeasurement',
        href: '/docs/concepts/remeasurement',
      },
    ],
  },
  {
    id: 'mobile-features',
    title: 'Mobile Features',
    titleKey: 'mobileFeatures',
    items: [
      {
        id: 'map-navigation',
        title: 'Map Navigation',
        titleKey: 'mapNavigation',
        href: '/docs/mobile/map-navigation',
      },
      {
        id: 'creating-interventions',
        title: 'Creating Interventions',
        titleKey: 'creatingInterventions',
        href: '/docs/mobile/creating-interventions',
      },
      {
        id: 'plot-management',
        title: 'Plot Management',
        titleKey: 'plotManagement',
        href: '/docs/mobile/plot-management',
      },
      {
        id: 'measurements',
        title: 'Measurements',
        titleKey: 'measurements',
        href: '/docs/mobile/measurements',
      },
      {
        id: 'photo-documentation',
        title: 'Photo Documentation',
        titleKey: 'photoDocumentation',
        href: '/docs/mobile/photo-documentation',
      },
      {
        id: 'offline-maps',
        title: 'Offline Maps',
        titleKey: 'offlineMaps',
        href: '/docs/mobile/offline-maps',
      },
    ],
  },
  {
    id: 'web-features',
    title: 'Web Dashboard',
    titleKey: 'webDashboard',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        titleKey: 'overview',
        href: '/docs/web/overview',
      },
      {
        id: 'sites-management',
        title: 'Sites Management',
        titleKey: 'sitesManagement',
        href: '/docs/web/sites-management',
      },
      {
        id: 'bulk-upload',
        title: 'Bulk Upload',
        titleKey: 'bulkUpload',
        href: '/docs/web/bulk-upload',
      },
      {
        id: 'team-management',
        title: 'Team Management',
        titleKey: 'teamManagement',
        href: '/docs/web/team-management',
      },
      {
        id: 'species-management',
        title: 'Species Management',
        titleKey: 'speciesManagement',
        href: '/docs/web/species-management',
      },
      {
        id: 'reports',
        title: 'Reports',
        titleKey: 'reports',
        href: '/docs/web/reports',
      },
    ],
  },
  {
    id: 'planet-platform',
    title: 'Planet Platform',
    titleKey: 'planetPlatform',
    items: [
      {
        id: 'planet-platform-intro',
        title: 'Introduction',
        titleKey: 'planetPlatformIntro',
        href: '/docs/planet-platform/introduction',
      },
      {
        id: 'planet-platform-registration',
        title: 'Registration',
        titleKey: 'planetPlatformRegistration',
        href: '/docs/planet-platform/registration',
      },
      {
        id: 'planet-platform-documents',
        title: 'Documents',
        titleKey: 'planetPlatformDocuments',
        href: '/docs/planet-platform/documents',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Help & Support',
    titleKey: 'helpSupport',
    items: [
      {
        id: 'faq',
        title: 'FAQ',
        titleKey: 'faq',
        href: '/docs/faq',
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        titleKey: 'contactSupport',
        href: '/docs/contact-support',
      },
    ],
  },
];