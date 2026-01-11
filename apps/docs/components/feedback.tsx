'use client';

import * as React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface FeedbackProps {
  pageId: string;
}

export function Feedback({ pageId }: FeedbackProps) {
  const t = useTranslations('docs.feedback');
  const [feedback, setFeedback] = React.useState<'positive' | 'negative' | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(`feedback-${pageId}`);
    if (stored) {
      setFeedback(stored as 'positive' | 'negative');
      setHasSubmitted(true);
    }
  }, [pageId]);

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    setHasSubmitted(true);
    localStorage.setItem(`feedback-${pageId}`, type);

    // Store aggregated feedback
    const allFeedback = JSON.parse(localStorage.getItem('all-feedback') || '{}');
    allFeedback[pageId] = {
      type,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('all-feedback', JSON.stringify(allFeedback));
  };

  return (
    <div className="border-t pt-6 mt-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm font-medium">{t('title')}</p>
        {!hasSubmitted ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('positive')}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              {t('yes')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('negative')}
              className="gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              {t('no')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('thanks')}</p>
        )}
      </div>
    </div>
  );
}
