'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { docsConfig, type DocItem } from '@/lib/docs';

export function Sidebar({ isMobile = false, onItemClick }: { isMobile?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  const tSections = useTranslations('sidebar.sections');
  const tItems = useTranslations('sidebar.items');
  const [openSections, setOpenSections] = React.useState<string[]>(() => {
    const activeSection = docsConfig.find((section) =>
      section.items.some((item) => pathname.includes(item.href))
    );
    return activeSection ? [activeSection.id] : ['getting-started'];
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (isMobile) {
    return (
      <nav className="p-4 space-y-2">
        {docsConfig.map((section) => (
          <div key={section.id} className="space-y-1">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                {tSections(section.titleKey)}
                {section.id === 'planet-platform' && (
                  <Image
                    src="https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/08/Plant-for-the-Planet-Official-Logo.svg"
                    alt="Plant-for-the-Planet"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                    unoptimized
                  />
                )}
              </span>
              {openSections.includes(section.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openSections.includes(section.id) && (
              <div className="ml-2 space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem key={item.id} item={item} pathname={pathname} tItems={tItems} onItemClick={onItemClick} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r bg-background md:sticky md:block">
      <nav className="p-4 space-y-2">
        {docsConfig.map((section) => (
          <div key={section.id} className="space-y-1">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                {tSections(section.titleKey)}
                {section.id === 'planet-platform' && (
                  <Image
                    src="https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/08/Plant-for-the-Planet-Official-Logo.svg"
                    alt="Plant-for-the-Planet"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                    unoptimized
                  />
                )}
              </span>
              {openSections.includes(section.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openSections.includes(section.id) && (
              <div className="ml-2 space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem key={item.id} item={item} pathname={pathname} tItems={tItems} onItemClick={onItemClick} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarItem({
  item,
  pathname,
  tItems,
  onItemClick,
}: {
  item: DocItem;
  pathname: string;
  tItems: ReturnType<typeof useTranslations>;
  onItemClick?: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
        isActive
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {tItems(item.titleKey)}
    </Link>
  );
}

export function MobileSidebar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations('sidebar');

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-background md:hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">{t('mobileTitle')}</span>
              <button onClick={() => setIsOpen(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <Sidebar isMobile onItemClick={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
