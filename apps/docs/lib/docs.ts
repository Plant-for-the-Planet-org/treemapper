export interface DocSection {
  id: string;
  titleKey: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  titleKey: string;
  href: string;
  items?: DocItem[];
}

export const docsConfig: DocSection[] = [
  {
    id: 'getting-started',
    titleKey: 'gettingStarted',
    items: [
      {
        id: 'introduction',
        titleKey: 'introduction',
        href: '/docs/introduction',
      },
      {
        id: 'mobile-setup',
        titleKey: 'mobileSetup',
        href: '/docs/mobile-setup',
      },
      {
        id: 'web-setup',
        titleKey: 'webSetup',
        href: '/docs/web-setup',
      },
      {
        id: 'quick-start',
        titleKey: 'quickStart',
        href: '/docs/quick-start',
      },
    ],
  },
  {
    id: 'tutorials',
    titleKey: 'tutorials',
    items: [
      {
        id: 'first-intervention',
        titleKey: 'firstIntervention',
        href: '/docs/tutorials/first-intervention',
      },
      {
        id: 'project-creation',
        titleKey: 'projectCreation',
        href: '/docs/tutorials/project-creation',
      },
      {
        id: 'site-creation',
        titleKey: 'siteCreation',
        href: '/docs/tutorials/site-creation',
      },
      {
        id: 'monitoring-plots',
        titleKey: 'monitoringPlots',
        href: '/docs/tutorials/monitoring-plots',
      },
      {
        id: 'managing-species',
        titleKey: 'managingSpecies',
        href: '/docs/tutorials/managing-species',
      },
      {
        id: 'working-offline',
        titleKey: 'workingOffline',
        href: '/docs/tutorials/working-offline',
      },
      {
        id: 'team-collaboration',
        titleKey: 'teamCollaboration',
        href: '/docs/tutorials/team-collaboration',
      },
      {
        id: 'analytics-reporting',
        titleKey: 'analyticsReporting',
        href: '/docs/tutorials/analytics-reporting',
      },
    ],
  },
  {
    id: 'key-concepts',
    titleKey: 'keyConcepts',
    items: [
      {
        id: 'interventions',
        titleKey: 'interventions',
        href: '/docs/concepts/interventions',
      },
      {
        id: 'plots',
        titleKey: 'plots',
        href: '/docs/concepts/plots',
      },
      {
        id: 'projects-sites',
        titleKey: 'projectsSites',
        href: '/docs/concepts/projects-sites',
      },
      {
        id: 'sync-offline',
        titleKey: 'syncOffline',
        href: '/docs/concepts/sync-offline',
      },
      {
        id: 'data-export',
        titleKey: 'dataExport',
        href: '/docs/concepts/data-export',
      },
      {
        id: 'remeasurement',
        titleKey: 'remeasurement',
        href: '/docs/concepts/remeasurement',
      },
    ],
  },
  {
    id: 'mobile-features',
    titleKey: 'mobileFeatures',
    items: [
      {
        id: 'map-navigation',
        titleKey: 'mapNavigation',
        href: '/docs/mobile/map-navigation',
      },
      {
        id: 'creating-interventions',
        titleKey: 'creatingInterventions',
        href: '/docs/mobile/creating-interventions',
      },
      {
        id: 'plot-management',
        titleKey: 'plotManagement',
        href: '/docs/mobile/plot-management',
      },
      {
        id: 'measurements',
        titleKey: 'measurements',
        href: '/docs/mobile/measurements',
      },
      {
        id: 'photo-documentation',
        titleKey: 'photoDocumentation',
        href: '/docs/mobile/photo-documentation',
      },
      {
        id: 'offline-maps',
        titleKey: 'offlineMaps',
        href: '/docs/mobile/offline-maps',
      },
    ],
  },
  {
    id: 'web-features',
    titleKey: 'webDashboard',
    items: [
      {
        id: 'overview',
        titleKey: 'overview',
        href: '/docs/web/overview',
      },
      {
        id: 'sites-management',
        titleKey: 'sitesManagement',
        href: '/docs/web/sites-management',
      },
      {
        id: 'bulk-upload',
        titleKey: 'bulkUpload',
        href: '/docs/web/bulk-upload',
      },
      {
        id: 'team-management',
        titleKey: 'teamManagement',
        href: '/docs/web/team-management',
      },
      {
        id: 'species-management',
        titleKey: 'speciesManagement',
        href: '/docs/web/species-management',
      },
      {
        id: 'reports',
        titleKey: 'reports',
        href: '/docs/web/reports',
      },
    ],
  },
  {
    id: 'troubleshooting',
    titleKey: 'helpSupport',
    items: [
      {
        id: 'faq',
        titleKey: 'faq',
        href: '/docs/faq',
      },
      {
        id: 'contact-support',
        titleKey: 'contactSupport',
        href: '/docs/contact-support',
      },
    ],
  },
];
