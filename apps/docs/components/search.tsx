'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search as SearchIcon, X, FileText, ArrowRight } from 'lucide-react';
import { docsConfig } from '@/lib/docs';

export function Search() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('search');
  const inputRef = React.useRef<HTMLInputElement>(null);

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
    setSelectedIndex(0);
  }, [filteredItems]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].href);
    }
  };

  const handleSelect = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    router.push(localizedHref);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 shadow-sm"
      >
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{t('placeholder')}</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />

          {/* Modal */}
          <div className="fixed left-1/2 top-[15%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="overflow-hidden rounded-xl border bg-background shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center border-b px-4">
                <SearchIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyNavigation}
                  placeholder={t('placeholder')}
                  className="flex-1 bg-transparent px-3 py-4 text-sm outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="rounded-md p-1 hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="ml-2 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {!query.trim() && (
                  <div className="px-3 py-8 text-center">
                    <SearchIcon className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t('startTyping') || 'Start typing to search documentation...'}
                    </p>
                  </div>
                )}

                {query.trim() && filteredItems.length === 0 && (
                  <div className="px-3 py-8 text-center">
                    <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                      <X className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">{t('noResults')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('tryDifferent') || 'Try a different search term'}
                    </p>
                  </div>
                )}

                {filteredItems.length > 0 && (
                  <div className="space-y-1">
                    {filteredItems.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                          selectedIndex === index
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.section}
                          </div>
                        </div>
                        {selectedIndex === index && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredItems.length > 0 && (
                <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
                    <span className="ml-1">to navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
                    <span className="ml-1">to select</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
