'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SpeciesHit, searchSpecies } from '../utils/speciesMatch';

/**
 * Search the scientific species list and pick one. Used in the review step to fix
 * names the automatic match could not resolve. Choosing nothing is a valid
 * outcome: the tree then saves with its species recorded as unknown, the same way
 * an unidentified tree from the mobile app does.
 */
const SpeciesPicker = ({
  token,
  value,
  displayName,
  onSelect,
  onClear,
  className,
}: {
  token: string;
  value: string | null;
  displayName: string;
  onSelect: (hit: SpeciesHit) => void;
  onClear?: () => void;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SpeciesHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (term.trim().length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const hits = await searchSpecies(token, term);
      if (!cancelled) {
        setResults(hits);
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setLoading(false);
    };
  }, [term, open, token]);

  // Seed the box with the name we failed to match, so the user can just correct
  // a typo instead of retyping the whole binomial.
  useEffect(() => {
    if (open && !term) setTerm(displayName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn('justify-between font-normal h-9', className)}
        >
          <span className={cn('truncate italic', !value && 'text-muted-foreground not-italic')}>
            {value ? displayName : displayName ? `${displayName} (unmatched)` : 'No species'}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search scientific name"
              className="pl-8 h-8 text-[13px]"
            />
          </div>
        </div>
        <div className="max-h-[240px] overflow-y-auto py-1">
          {loading && (
            <p className="px-3 py-2 text-[12px] text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching…
            </p>
          )}
          {!loading && term.trim().length < 3 && (
            <p className="px-3 py-2 text-[12px] text-muted-foreground">
              Type at least 3 letters.
            </p>
          )}
          {!loading && term.trim().length >= 3 && results.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-muted-foreground">
              No match. Leave it blank to record this tree as an unknown species.
            </p>
          )}
          {results.map((hit) => (
            <button
              key={hit.uid}
              type="button"
              onClick={() => {
                onSelect(hit);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-muted flex items-center gap-2"
            >
              <Check className={cn('w-3.5 h-3.5 flex-none', value === hit.uid ? 'opacity-100' : 'opacity-0')} />
              <span className="italic truncate">{hit.scientificName}</span>
            </button>
          ))}
        </div>
        {value && onClear && (
          <div className="border-t p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-7 text-[11.5px] text-muted-foreground"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Record as unknown species instead
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default SpeciesPicker;
