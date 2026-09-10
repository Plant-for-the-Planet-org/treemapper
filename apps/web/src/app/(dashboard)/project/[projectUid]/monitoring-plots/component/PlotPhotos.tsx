'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { cdnUrl } from '@/lib/cdn';
import { cn } from '@/lib/utils';
import { PlotImage, fmtDate } from './plotAnalytics';
import { Mono } from './PlotCharts';

/**
 * Photos of a plot and of its plants.
 *
 * Both the device and the dashboard presign plot photography into the `tree`
 * folder, the same as intervention photos, so one folder rebuilds every url here
 * (see the note on ImageRowInput in monitoring-plots.service.ts).
 */
export const photoUrl = (filename: string | null | undefined) => cdnUrl('tree', filename);

/** One photo, ready to show: a resolvable url plus what to say about it. */
export type Photo = {
  key: string;
  url: string;
  caption: string;
  meta: string | null;
};

/** Drop photos with no filename, and label each with its kind and capture date. */
export const toPhotos = (images: PlotImage[] | undefined, captionPrefix = ''): Photo[] =>
  (images ?? [])
    .map((img) => {
      const url = photoUrl(img.filename);
      if (!url) return null;
      const kind = img.type ? img.type.replace(/_/g, ' ') : 'photo';
      return {
        key: img.uid || img.filename,
        url,
        caption: captionPrefix ? `${captionPrefix} · ${kind}` : kind,
        meta: img.notes || fmtDate(img.createdAt),
      };
    })
    .filter((p): p is Photo => p !== null);

/* ------------------------------------------------------------------ lightbox */

const Lightbox = ({
  photos, index, onClose, onStep,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    // The overlay covers the page, so stop the page behind it from scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, onStep]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption}
      className="fixed inset-0 z-50 bg-black/85 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/80 flex-none">
        <div className="min-w-0">
          <div className="text-[13px] font-medium capitalize truncate text-white">{photo.caption}</div>
          {photo.meta && <div className="text-[11.5px] text-white/60 truncate">{photo.meta}</div>}
        </div>
        <div className="flex items-center gap-3 flex-none">
          <span className="text-[11.5px] tabular-nums text-white/60">{index + 1} / {photos.length}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 inline-flex items-center justify-center rounded-[3px] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
        {photos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onStep(-1); }}
            aria-label="Previous photo"
            className="w-10 h-10 flex-none inline-flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />
        {photos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onStep(1); }}
            aria-label="Next photo"
            className="w-10 h-10 flex-none inline-flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- thumbnails */

const Thumb = ({
  photo, size, onOpen,
}: {
  photo: Photo;
  size: 'sm' | 'md';
  onOpen: () => void;
}) => {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      title={photo.caption}
      className={cn(
        'relative overflow-hidden border bg-muted rounded-[3px] group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        size === 'sm' ? 'w-10 h-10' : 'aspect-square w-full',
      )}
    >
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImageOff className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={photo.url}
          alt={photo.caption}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
      )}
    </button>
  );
};

/**
 * A grid of photos that opens a lightbox. `size` is `sm` for the inline strips
 * beside a table row and `md` for a gallery that fills its own panel.
 */
export const PhotoGrid = ({
  photos, size = 'md', className,
}: {
  photos: Photo[];
  size?: 'sm' | 'md';
  className?: string;
}) => {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback((delta: number) => {
    setOpen((current) => {
      if (current === null) return current;
      return (current + delta + photos.length) % photos.length;
    });
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          size === 'sm'
            ? 'flex flex-wrap gap-1.5'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2',
          className,
        )}
      >
        {photos.map((p, i) => (
          <Thumb key={p.key} photo={p} size={size} onOpen={() => setOpen(i)} />
        ))}
      </div>
      {open !== null && (
        <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onStep={step} />
      )}
    </>
  );
};

/** A single cover photo, for a list row or a card. Silent when there is none. */
export const CoverThumb = ({ filename, alt }: { filename: string | null; alt: string }) => {
  const [failed, setFailed] = useState(false);
  const url = photoUrl(filename);
  if (!url || failed) {
    return (
      <div className="w-9 h-9 flex-none border rounded-[3px] bg-muted flex items-center justify-center text-muted-foreground/50">
        <ImageOff className="w-3.5 h-3.5" />
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-9 h-9 flex-none border rounded-[3px] object-cover bg-muted"
    />
  );
};

/** Empty state shared by the photo panels. */
export const NoPhotos = ({ label }: { label: string }) => (
  <p className="text-sm text-muted-foreground py-10 text-center">{label}</p>
);

/** A labelled block of photos, used to group a plant's photos in the gallery. */
export const PhotoSection = ({
  title, note, photos,
}: {
  title: string;
  note?: string | null;
  photos: Photo[];
}) => {
  if (photos.length === 0) return null;
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[12.5px] font-medium">{title}</span>
        {note && <Mono className="text-[10.5px] text-muted-foreground/70">{note}</Mono>}
        <span className="text-[10.5px] text-muted-foreground/70 ml-auto">
          {photos.length} photo{photos.length === 1 ? '' : 's'}
        </span>
      </div>
      <PhotoGrid photos={photos} />
    </div>
  );
};
