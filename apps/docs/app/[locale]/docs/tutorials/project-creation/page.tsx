import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function ProjectCreationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.projectCreation');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="project-creation"
    >
      <p>
        {t('intro1')} <strong>{t('project')}</strong> {t('intro2')}
      </p>

      <p>
        {t('intro3')} <strong>{t('signIn')}</strong> {t('intro4')}
      </p>

      <PlaceholderImage
        title={t('createProjectImageTitle')}
        description={t('createProjectImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('requiredDetailsTitle')}</h2>
      <p>{t('requiredDetailsIntro')}</p>
      <ul>
        <li>
          <strong>{t('name')}</strong>: {t('nameDesc')}
        </li>
        <li>
          <strong>{t('projectType')}</strong>: {t('projectTypeDesc1')} <strong>{t('personal')}</strong> {t('projectTypeDesc2')}
        </li>
        <li>
          <strong>{t('location')}</strong>: {t('locationDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('projectDetailsImageTitle')}
        description={t('projectDetailsImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('afterCreateTitle')}</h2>
      <p>
        {t('afterCreateIntro')}
      </p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/team-collaboration`}>{t('afterCreateLink1')}</Link> {t('afterCreateLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/site-creation`}>{t('afterCreateLink2')}</Link> {t('afterCreateLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('afterCreateLink3')}</Link> {t('afterCreateLink3Desc')}
        </li>
      </ul>

      <h2>{t('editingTitle')}</h2>
      <p>
        {t('editingDesc')} <strong>{t('projectEdit')}</strong> {t('editingDescEnd')}
      </p>

      <h2>{t('mobileVsWebTitle')}</h2>
      <p>
        {t('mobileVsWebIntro')} <strong>{t('mobileApp')}</strong> {t('mobileVsWebMid')} <strong>{t('webDashboard')}</strong> {t('mobileVsWebEnd')}
      </p>

      <h2>{t('whatsNextTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/site-creation`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/team-collaboration`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
