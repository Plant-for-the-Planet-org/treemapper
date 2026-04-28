import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function TeamCollaborationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.teamCollaboration');
  const tUi = await getTranslations('ui');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="team-collaboration"
    >
      <p>
        {t('intro1')}
      </p>

      <PlaceholderImage
        title={t('teamManagementImageTitle')}
        description={t('teamManagementImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('roleManagementTitle')}</h2>
      <p>
        {t('roleManagementDesc')}
      </p>

      <h2>{t('availableRolesTitle')}</h2>
      <p>{t('availableRolesIntro')}</p>

      <h3>{t('ownerTitle')}</h3>
      <p>
        <strong>{t('highestLevel')}</strong>. {t('ownerDesc')}
      </p>
      <ul>
        <li>{t('ownerItem1')}</li>
        <li>{t('ownerItem2')}</li>
        <li>{t('ownerItem3')}</li>
        <li>{t('ownerItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('ownerRoleImageTitle')}
        description={t('ownerRoleImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('adminTitle')}</h3>
      <p>
        <strong>{t('nextToOwner')}</strong> {t('adminDesc')}
      </p>
      <ul>
        <li>{t('adminItem1')}</li>
        <li>{t('adminItem2')}</li>
        <li>{t('adminItem3')}</li>
        <li>{t('adminItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('adminRoleImageTitle')}
        description={t('adminRoleImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('contributorTitle')}</h3>
      <p>
        <strong>{t('mostImportant')}</strong> {t('contributorDesc')}
      </p>
      <ul>
        <li>{t('contributorItem1')}</li>
        <li>{t('contributorItem2')}</li>
        <li>{t('contributorItem3')}</li>
        <li>{t('contributorItem4')}</li>
        <li>{t('contributorItem5')}</li>
      </ul>

      <PlaceholderImage
        title={t('contributorRoleImageTitle')}
        description={t('contributorRoleImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('observerTitle')}</h3>
      <p>
        {t('observerDesc1')} <strong>{t('readOnlyAccess')}</strong> {t('observerDesc2')}
      </p>
      <ul>
        <li>{t('observerItem1')}</li>
        <li>{t('observerItem2')}</li>
        <li>{t('observerItem3')}</li>
        <li>{t('observerItem4')}</li>
        <li>{t('observerItem5')}</li>
      </ul>

      <PlaceholderImage
        title={t('observerRoleImageTitle')}
        description={t('observerRoleImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('managingTeamTitle')}</h2>
      <p>
        {t('managingTeamDesc')}
      </p>

      <h3>{t('sendingInvitationsTitle')}</h3>
      <p>{t('sendingInvitationsIntro')}</p>

      <h4>{t('emailInvitationTitle')}</h4>
      <ol>
        <li>{t('emailInvitationStep1')} <strong>{t('team')}</strong> {t('emailInvitationStep1End')}</li>
        <li>{t('emailInvitationStep2')} <strong>{t('inviteMember')}</strong></li>
        <li>{t('emailInvitationStep3')}</li>
        <li>{t('emailInvitationStep4')}</li>
        <li>{t('emailInvitationStep5')}</li>
      </ol>

      <h4>{t('bulkInviteTitle')}</h4>
      <p>
        {t('bulkInviteIntro')}
      </p>
      <ol>
        <li>{t('bulkInviteStep1')} <strong>{t('team')}</strong> {t('bulkInviteStep1End')}</li>
        <li>{t('bulkInviteStep2')} <strong>{t('bulkInvite')}</strong></li>
        <li>{t('bulkInviteStep3')}</li>
        <li>{t('bulkInviteStep4')}</li>
        <li>{t('bulkInviteStep5')}</li>
      </ol>

      <PlaceholderImage
        title={t('teamInvitationsImageTitle')}
        description={t('teamInvitationsImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('managingInvitationsTitle')}</h3>
      <p>
        {t('managingInvitationsDesc')}
      </p>

      <p>{t('youCanIntro')}</p>
      <ul>
        <li><strong>{t('viewPendingInvitations')}</strong>: {t('viewPendingInvitationsDesc')}</li>
        <li><strong>{t('resendInvitations')}</strong>: {t('resendInvitationsDesc')}</li>
        <li><strong>{t('cancelInvitations')}</strong>: {t('cancelInvitationsDesc')}</li>
        <li><strong>{t('updateRoles')}</strong>: {t('updateRolesDesc')}</li>
        <li><strong>{t('removeTeamMembers')}</strong>: {t('removeTeamMembersDesc')}</li>
      </ul>

      <PlaceholderImage
        title={t('managingTeamImageTitle')}
        description={t('managingTeamImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{tUi('alerts.bestPractices')}</h4>
        <ul className="mb-0">
          <li>{t('bestPractice1')}</li>
          <li>{t('bestPractice2')}</li>
          <li>{t('bestPractice3')}</li>
          <li>{t('bestPractice4')}</li>
          <li>{t('bestPractice5')}</li>
        </ul>
      </div>

      <h2>{t('whatsNextTitle')}</h2>
      <p>{t('whatsNextIntro')}</p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/web-setup`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('nextLink2')}</Link> - {t('nextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/web/overview`}>{t('nextLink3')}</Link> {t('nextLink3Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
