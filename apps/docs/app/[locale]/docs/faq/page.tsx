'use client';

import { DocPage } from '@/components/doc-page';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is TreeMapper?',
    answer: (
      <>
        TreeMapper is a comprehensive tree planting and forest restoration tracking platform. It
        consists of a mobile app for field data collection and a web dashboard for project
        management, analytics, and reporting. TreeMapper helps organizations document planting
        activities, monitor tree growth, and report on restoration progress.
      </>
    ),
  },
  {
    category: 'Getting Started',
    question: 'Is TreeMapper free to use?',
    answer: (
      <>
        Yes, TreeMapper is free for restoration projects. The mobile app can be downloaded from the
        App Store (iOS) or Google Play Store (Android), and the web dashboard is accessible at no
        cost. TreeMapper is developed by Plant-for-the-Planet to support global reforestation
        efforts.
      </>
    ),
  },
  {
    category: 'Getting Started',
    question: 'What devices are supported?',
    answer: (
      <>
        The TreeMapper mobile app works on iOS devices (iPhone and iPad) and Android devices. The
        web dashboard works on any modern web browser including Chrome, Firefox, Safari, and Edge on
        desktop and laptop computers.
      </>
    ),
  },

  // Mobile App
  {
    category: 'Mobile App',
    question: 'Can I use TreeMapper offline?',
    answer: (
      <>
        Yes! TreeMapper is designed for field use where internet connectivity may be limited. You
        can create interventions, take measurements, and capture photos completely offline. All data
        is stored locally on your device and automatically syncs to the server when you regain
        internet connectivity. You can also download offline maps for navigation in remote areas.
      </>
    ),
  },
  {
    category: 'Mobile App',
    question: 'How accurate is the GPS in TreeMapper?',
    answer: (
      <>
        GPS accuracy depends on your device and environmental conditions. TreeMapper displays a GPS
        accuracy indicator so you know the precision of your location data. For best results, wait
        for the accuracy to show under 10 meters before marking locations. Standing in open areas
        with clear sky visibility improves accuracy.
      </>
    ),
  },
  {
    category: 'Mobile App',
    question: 'What happens if I delete the app?',
    answer: (
      <>
        Synced interventions are safely stored on the server and won&apos;t be lost. However, any
        unsynced interventions stored only on your device will be permanently deleted. Always sync
        your data before uninstalling the app or switching devices to ensure nothing is lost.
      </>
    ),
  },
  {
    category: 'Mobile App',
    question: 'How many interventions can I create offline?',
    answer: (
      <>
        There&apos;s no practical limit to offline interventions. You can create hundreds of
        interventions offline, limited only by your device storage (primarily due to photos). Each
        intervention without photos uses only about 1KB of data. Photos are the main storage
        consideration.
      </>
    ),
  },

  // Data & Sync
  {
    category: 'Data & Sync',
    question: 'How do I sync my data?',
    answer: (
      <>
        Data syncs automatically when your device has an internet connection. You can also manually
        trigger a sync from the interventions list. The app shows sync status for each intervention
        so you know which ones have been uploaded and which are pending.
      </>
    ),
  },
  {
    category: 'Data & Sync',
    question: 'Can I edit an intervention after syncing?',
    answer: (
      <>
        Yes, you can edit most fields like notes, species, and measurements after syncing. However,
        changing the location or intervention type may require administrator approval depending on
        your project settings. Edits are tracked for audit purposes.
      </>
    ),
  },
  {
    category: 'Data & Sync',
    question: 'How do I export my data?',
    answer: (
      <>
        From the mobile app, you can export individual interventions as GeoJSON files for use in GIS
        software like ArcGIS. From the web dashboard, you can export all your data in Excel format,
        with options to filter by date range. Species data and team data can also be exported from
        their respective sections. See{' '}
        <Link href="/docs/concepts/data-export" className="text-primary hover:underline">
          Data Export
        </Link>{' '}
        for more details.
      </>
    ),
  },

  // Projects & Sites
  {
    category: 'Projects & Sites',
    question: 'What is the difference between a project and a site?',
    answer: (
      <>
        A <strong>project</strong> is the overall restoration initiative that contains all related
        activities, team members, and analytics. A <strong>site</strong> is a specific geographic
        area (polygon) within a project where planting and other activities take place. One project
        can have many sites. See{' '}
        <Link href="/docs/concepts/projects-sites" className="text-primary hover:underline">
          Projects vs Sites
        </Link>{' '}
        for more details.
      </>
    ),
  },
  {
    category: 'Projects & Sites',
    question: 'How do I create a site boundary?',
    answer: (
      <>
        You can create site boundaries in three ways: (1) Draw a polygon directly on the map in the
        web dashboard, (2) Upload a GeoJSON file if you have existing GIS data, or (3) Use the
        mobile app&apos;s GPS tracking to walk the perimeter and trace the boundary. The area is
        calculated automatically from the boundary.
      </>
    ),
  },

  // Team & Permissions
  {
    category: 'Team & Permissions',
    question: 'What are the different user roles?',
    answer: (
      <>
        TreeMapper has four roles: <strong>Owner</strong> (full control including deletion),{' '}
        <strong>Admin</strong> (manage team, sites, and settings), <strong>Contributor</strong>{' '}
        (create and edit interventions), and <strong>Observer</strong> (read-only access). Each role
        has specific permissions suited to different team member responsibilities.
      </>
    ),
  },
  {
    category: 'Team & Permissions',
    question: 'How do I invite team members?',
    answer: (
      <>
        From the web dashboard, go to Team Management and click Invite. Enter the person&apos;s
        email address, select their role, and send the invitation. They&apos;ll receive an email
        with a link to join your project. You can also bulk invite multiple people using a CSV file.
      </>
    ),
  },

  // Species
  {
    category: 'Species',
    question: 'How many species are available?',
    answer: (
      <>
        TreeMapper includes over 60,000 species from the Plant-for-the-Planet database, covering the
        most commonly planted species worldwide. The species list is downloaded during app
        installation and available offline. If you need a species that&apos;s not in the database,
        you can request it to be added.
      </>
    ),
  },
  {
    category: 'Species',
    question: 'What if I cannot identify a species in the field?',
    answer: (
      <>
        You can record an &quot;unknown species&quot; during field work. Later, from the web
        dashboard, you can review unknown species and assign them to the correct scientific species
        once identified. This maintains data integrity while allowing field work to continue without
        delays.
      </>
    ),
  },

  // Monitoring & Remeasurement
  {
    category: 'Monitoring',
    question: 'How do I track tree growth over time?',
    answer: (
      <>
        Use the remeasurement feature to record updated measurements for trees. Select the tree,
        choose &quot;Measure,&quot; and enter new height and diameter values with a photo. All
        measurements are stored as a timeline history. You can also set up remeasurement reminders
        and see trees due for remeasurement highlighted in red on the map. See{' '}
        <Link href="/docs/concepts/remeasurement" className="text-primary hover:underline">
          Remeasurement
        </Link>{' '}
        for details.
      </>
    ),
  },
  {
    category: 'Monitoring',
    question: 'What are monitoring plots?',
    answer: (
      <>
        Monitoring plots are defined areas (circular or rectangular) used for systematic, long-term
        data collection. They can be intervention plots (in restored areas) or control plots (for
        comparison). Plots help you track individual plants, measure growth, and assess restoration
        success over time.
      </>
    ),
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0 px-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

function FAQCategory({ category, items }: { category: string; items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-primary/20">{category}</h2>
      <div className="rounded-lg border border-border bg-card">
        {items.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function FAQPage() {
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <DocPage
      title="Frequently Asked Questions"
      description="Find answers to common questions about TreeMapper."
      pageId="faq"
    >
      <p className="text-lg text-muted-foreground mb-8">
        Browse our most frequently asked questions below. Can&apos;t find what you&apos;re looking
        for?{' '}
        <Link href="/docs/contact-support" className="text-primary hover:underline">
          Contact support
        </Link>{' '}
        for assistance.
      </p>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <a
            key={category}
            href={`#${category.toLowerCase().replace(/\s+/g, '-')}`}
            className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {category}
          </a>
        ))}
      </div>

      {/* FAQ Sections */}
      {categories.map((category) => (
        <div key={category} id={category.toLowerCase().replace(/\s+/g, '-')}>
          <FAQCategory category={category} items={faqs.filter((faq) => faq.category === category)} />
        </div>
      ))}

      {/* Still Need Help */}
      <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
        <p className="text-muted-foreground mb-4">
          Our support team is here to help. Reach out directly for assistance.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            style={{color:'white'}}
            href="/docs/contact-support"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </DocPage>
  );
}
