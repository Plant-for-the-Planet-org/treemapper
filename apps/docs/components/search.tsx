'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { docsConfig } from '@/lib/docs';
import { useTranslations } from 'next-intl';

export function Search() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();
  const t = useTranslations('search');

  const allItems = React.useMemo(() => {
    return docsConfig.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        section: section.title,
      }))
    );
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return [];
    const searchQuery = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery) ||
        item.section.toLowerCase().includes(searchQuery)
    );
  }, [query, allItems]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">{t('placeholder')}</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-lg border bg-background p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('placeholder')}
                className="border-0 focus-visible:ring-0"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {query.trim() && filteredItems.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('noResults')}
                </div>
              )}
              {filteredItems.length > 0 && (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="w-full rounded-md p-3 text-left hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.section}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
