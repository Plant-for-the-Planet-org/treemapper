'use client'

import { useMemo, useState } from 'react';
import { Info, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DonationCard } from './DonationCard';
import { IgnoreDonationDialog } from './IgnoreDonationDialog';
import { ProjectUnderReviewNotice } from './ProjectUnderReviewNotice';
import {
  COUNTRY_OPTIONS, Contribution, MatchAmounts, PAGE_SIZE, contribMatchState, fmtNum,
} from './types';
import type {
  DonationsPaneState, DonationSort, DonorType, MatchStateFilter,
} from './hooks/useTreematchDonations';

interface Props {
  donations: DonationsPaneState;
  /** the project the donations belong to, named in the "not synced yet" notice */
  projectName: string;
  selected: Set<number>;
  isBlocked: (id: number) => boolean;
  onToggle: (id: number) => void;
  amounts: MatchAmounts;
  onAmountChange: (id: number, raw: string) => void;
  onAmountReset: (id: number) => void;
  /** the selected donations already claim every tree the selected locations
   * have, so nothing more can be added */
  demandCoversSupply: boolean;
}

export function DonationsPane({
  donations, projectName, selected, isBlocked, onToggle,
  amounts, onAmountChange, onAmountReset, demandCoversSupply,
}: Props) {
  const {
    items, pagination, loading, loadingMore, error, notOnPlatform, ignored,
    tab, changeTab, filters,
    reload, loadMore, reloadIgnored, loadMoreIgnored, ignore, restore,
  } = donations;
  const { matchState, search } = filters;

  // Ignoring is confirmed in a dialog, which is also where the reason is typed,
  // so the card's button opens this rather than writing straight away.
  const [ignoreTarget, setIgnoreTarget] = useState<Contribution | null>(null);

  // The default server view never contains ignored donations, so only the
  // client-side filters apply here.
  //
  // Sort, donor type and country are server-side and cover the whole project.
  // These two are not: TTC's contributions endpoint has no reference search and
  // no allocation-state filter, so they can only narrow the pages already
  // fetched. Everything below that reports a count says which set it counted,
  // because a filtered miss and an unfetched page look identical otherwise.
  //
  // They live here rather than in the data hook because they need the selection,
  // which is derived from the very list the hook owns.
  const localFilterActive = matchState !== 'all' || search.trim() !== '';

  const { shown, pinnedCount } = useMemo(() => {
    if (!localFilterActive) return { shown: items, pinnedCount: 0 };
    const q = search.trim().toLowerCase();
    const passes = (c: Contribution) =>
      (matchState === 'all' || contribMatchState(c) === matchState)
      && (!q || c.donation.uid.toLowerCase().includes(q));

    let pinned = 0;
    const list = items.filter(c => {
      if (passes(c)) return true;
      // A selected donation is in the next match whether or not it still passes
      // these filters, and the bottom bar and the confirm dialog both count it.
      // Filtering it off screen would leave that count with no row behind it,
      // and would match donations the user can no longer see. Selections stay
      // in view instead, and the note below says how many are held there.
      if (selected.has(c.id)) { pinned += 1; return true; }
      return false;
    });
    return { shown: list, pinnedCount: pinned };
  }, [items, matchState, search, selected, localFilterActive]);

  const morePages = pagination.page < pagination.totalPages;
  const notSearched = Math.max(0, pagination.total - items.length);

  // The reference search and the match-state filter run over loaded pages only
  // (TTC offers neither), so "rows on screen" and "donations that exist" are two
  // different numbers. While one of those filters is on, this line is the only
  // place either number is spelled out, and the pane's footer button is hidden:
  // a full-width "load more" under a one-row list reads as "more rows below",
  // which is exactly the wrong thing to say. Paging deeper survives as a link
  // inside this note, where it reads as searching rather than as pagination.
  const filterNote = useMemo(() => {
    if (!localFilterActive) return null;
    const searched = items.length;
    // Rows that only survived the filter because they are selected are counted
    // in `shown`, so the line has to say so or the arithmetic looks wrong.
    const pinned = pinnedCount > 0
      ? ` Includes ${fmtNum(pinnedCount)} selected donation${pinnedCount === 1 ? '' : 's'} kept in view.`
      : '';
    if (!morePages) {
      return shown.length === 0
        ? 'No donation matches these filters.'
        : `Showing ${fmtNum(shown.length)} of ${fmtNum(searched)} donation${searched === 1 ? '' : 's'}.${pinned}`;
    }
    const scope = `the first ${fmtNum(searched)} of ${fmtNum(pagination.total)} donations`;
    return shown.length === 0
      ? `No match in ${scope}.`
      : `Showing ${fmtNum(shown.length)} of ${scope}.${pinned}`;
  }, [localFilterActive, shown.length, items.length, pinnedCount, morePages, pagination.total]);

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-3.5 pb-3 space-y-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-foreground">Donations</h2>
            <Badge variant="secondary" className="rounded-full px-2 text-[11px]">
              {/* With a local filter on, the badge counts the rows actually
                * on screen. The project total is not dropped, it moves into
                * the note under the tabs, which is the one line that can
                * explain the gap between the two. */}
              {fmtNum(tab === 'ignored'
                ? ignored.pagination.total
                : localFilterActive ? shown.length : pagination.total)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Paid project contributions</p>
        </div>
        {/* Neither view exists until the project reaches the donation backend,
          * so the tabs and the filters would all be controls over nothing. */}
        {!notOnPlatform && (
          <Tabs value={tab} onValueChange={changeTab}>
            <TabsList className="w-full h-9">
              <TabsTrigger value="toMatch" className="flex-1 text-xs">To match</TabsTrigger>
              {/* The count appears once the view has been fetched; before that
                  there is no server total, and 0 would be a guess. */}
              <TabsTrigger value="ignored" className="flex-1 text-xs">
                Ignored{ignored.loaded ? ` (${fmtNum(ignored.pagination.total)})` : ''}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {!notOnPlatform && tab !== 'ignored' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[130px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => filters.setSearch(e.target.value)}
                placeholder="Search donation ref"
                className="h-9 pl-9 text-xs rounded-lg"
              />
            </div>
            <Select value={filters.sort} onValueChange={v => filters.setSort(v as DonationSort)}>
              <SelectTrigger className="h-9 text-xs rounded-lg w-[104px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.donorType} onValueChange={v => filters.setDonorType(v as DonorType)}>
              <SelectTrigger className="h-9 text-xs rounded-lg w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All donors</SelectItem>
                <SelectItem value="individual">Individuals</SelectItem>
                <SelectItem value="company">Companies</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.country} onValueChange={filters.setCountry}>
              <SelectTrigger className="h-9 text-xs rounded-lg w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {COUNTRY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={matchState} onValueChange={v => filters.setMatchState(v as MatchStateFilter)}>
              <SelectTrigger className="h-9 text-xs rounded-lg w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All matches</SelectItem>
                <SelectItem value="none">No trees matched</SelectItem>
                <SelectItem value="partial">Partly matched</SelectItem>
                <SelectItem value="complete">Fully matched</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
        {notOnPlatform ? (
          <ProjectUnderReviewNotice projectName={projectName} className="h-full" />
        ) : tab === 'ignored' ? (
          <>
            {ignored.error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1.5">
                <p>{ignored.error}</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={reloadIgnored}>Retry</Button>
              </div>
            )}
            {ignored.loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" /> Loading ignored donations…
              </div>
            )}
            {!ignored.loading && ignored.items.map(c => (
              <DonationCard
                key={c.id}
                contribution={c}
                checked={false}
                onToggle={onToggle}
                onRestore={restore}
              />
            ))}
            {!ignored.loading && !ignored.error && ignored.items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">No ignored donations.</p>
            )}
            {!ignored.loading && ignored.pagination.page < ignored.pagination.totalPages && (
              <Button
                variant="outline" size="sm" className="w-full"
                disabled={ignored.loadingMore}
                onClick={loadMoreIgnored}
              >
                {ignored.loadingMore
                  ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                  : `Load more (${fmtNum(ignored.items.length)} of ${fmtNum(ignored.pagination.total)})`}
              </Button>
            )}
          </>
        ) : (
          <>
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1.5">
                <p>{error}</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={reload}>Retry</Button>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" /> Loading donations…
              </div>
            )}
            {!loading && !error && demandCoversSupply && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  The selected donations already claim every tree the selected
                  plant locations have. Deselect one, or select another location,
                  to pick more.
                </span>
              </div>
            )}
            {!loading && !error && filterNote && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  {filterNote}
                  {morePages && (
                    <>
                      {' '}
                      <button
                        type="button"
                        disabled={loadingMore}
                        onClick={loadMore}
                        className="font-medium text-foreground underline underline-offset-2 hover:text-primary disabled:no-underline disabled:opacity-60"
                      >
                        {loadingMore
                          ? 'Searching…'
                          : `Search ${fmtNum(Math.min(PAGE_SIZE, notSearched))} more`}
                      </button>
                    </>
                  )}
                </span>
              </div>
            )}
            {!loading && shown.map(c => (
              <DonationCard
                key={c.id}
                contribution={c}
                checked={selected.has(c.id)}
                onToggle={onToggle}
                onIgnore={() => setIgnoreTarget(c)}
                blocked={isBlocked(c.id)}
                amount={amounts[c.id]}
                onAmountChange={onAmountChange}
                onAmountReset={onAmountReset}
              />
            ))}
            {/* The filtered empty case is already stated by the note above,
              * word for word, so this only covers "the project has none". */}
            {!loading && !error && !localFilterActive && shown.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">Nothing here.</p>
            )}
            {/* Unfiltered only: here the list really is every loaded row, so
              * a pagination footer describes it honestly. Filtered, it would
              * not, and the note above carries the action instead. */}
            {!loading && !localFilterActive && morePages && (
              <Button
                variant="outline" size="sm" className="w-full"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore
                  ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                  : `Load more (${fmtNum(items.length)} of ${fmtNum(pagination.total)} loaded)`}
              </Button>
            )}
          </>
        )}
      </div>

      <IgnoreDonationDialog
        open={!!ignoreTarget}
        contribution={ignoreTarget}
        onOpenChange={(v) => { if (!v) setIgnoreTarget(null); }}
        onConfirm={ignore}
      />
    </div>
  );
}
