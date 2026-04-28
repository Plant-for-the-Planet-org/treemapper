import { cn } from '@/lib/utils';

interface PlaceholderImageProps {
  title: string;
  description?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'landscape';
  className?: string;
}

export function PlaceholderImage({
  title,
  description,
  aspectRatio = 'video',
  className,
}: PlaceholderImageProps) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[9/16]',
    landscape: 'aspect-[16/9]',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-8 text-center',
        aspectClasses[aspectRatio],
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground mb-4"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
  );
}
