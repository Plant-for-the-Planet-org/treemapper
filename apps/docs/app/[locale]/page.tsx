import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Globe, TrendingUp } from 'lucide-react';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/docs/introduction`}>
                <Button size="lg" className="gap-2">
                  {t('getStarted')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/${locale}/docs/quick-start`}>
                <Button variant="outline" size="lg">
                  {t('viewDocs')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container px-4 py-16 border-t">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('features.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title={t('features.mobile.title')}
              description={t('features.mobile.description')}
              href={`/${locale}/docs/mobile-setup`}
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title={t('features.web.title')}
              description={t('features.web.description')}
              href={`/${locale}/docs/web-setup`}
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title={t('features.concepts.title')}
              description={t('features.concepts.description')}
              href={`/${locale}/docs/concepts/interventions`}
            />
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>
            Built by{' '}
            <a
              href="https://www.plant-for-the-planet.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Plant-for-the-Planet
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border p-6 hover:border-primary transition-colors"
    >
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
