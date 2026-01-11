import { Feedback } from '@/components/feedback';

interface DocPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  pageId: string;
}

export function DocPage({ title, description, children, pageId }: DocPageProps) {
  return (
    <article className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        {description && (
          <p className="text-xl text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {children}
      </div>
      <Feedback pageId={pageId} />
    </article>
  );
}
