import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function TeamManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.teamManagement');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="team-management"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('teamMemberListTitle')}</h2>
      <p>
        {t('teamMemberListDesc')}
      </p>

      <PlaceholderImage
        title={t('teamListImageTitle')}
        description={t('teamListImageDesc')}
      />

      <h3>{t('memberInformationTitle')}</h3>
      <p>{t('memberInformationIntro')}</p>
      <ul>
        <li>
          <strong>{t('avatar')}</strong>: {t('avatarDesc')}
        </li>
        <li>
          <strong>{t('name')}</strong>: {t('nameDesc')}
        </li>
        <li>
          <strong>{t('email')}</strong>: {t('emailDesc')}
        </li>
        <li>
          <strong>{t('role')}</strong>: {t('roleDesc')}
        </li>
        <li>
          <strong>{t('lastActive')}</strong>: {t('lastActiveDesc')}
        </li>
        <li>
          <strong>{t('joinedDate')}</strong>: {t('joinedDateDesc')}
        </li>
        <li>
          <strong>{t('status')}</strong>: {t('statusDesc')}
        </li>
      </ul>

      <h2>{t('searchAndFilterTitle')}</h2>
      <p>{t('searchAndFilterIntro')}</p>
      <ul>
        <li>
          <strong>{t('fullTextSearch')}</strong>: {t('fullTextSearchDesc')}
        </li>
        <li>
          <strong>{t('sortableColumns')}</strong>: {t('sortableColumnsDesc')}
        </li>
        <li>
          <strong>{t('sortDirection')}</strong>: {t('sortDirectionDesc')}
        </li>
      </ul>

      <h2>{t('teamRolesTitle')}</h2>
      <p>
        {t('teamRolesDesc')}
      </p>

      <h3>{t('owner')}</h3>
      <p>{t('ownerIntro')}</p>
      <ul>
        <li>{t('ownerItem1')}</li>
        <li>{t('ownerItem2')}</li>
        <li>{t('ownerItem3')}</li>
        <li>{t('ownerItem4')}</li>
      </ul>

      <h3>{t('admin')}</h3>
      <p>{t('adminIntro')}</p>
      <ul>
        <li>{t('adminItem1')}</li>
        <li>{t('adminItem2')}</li>
        <li>{t('adminItem3')}</li>
        <li>{t('adminItem4')}</li>
        <li>{t('adminItem5')}</li>
        <li>{t('adminItem6')}</li>
      </ul>

      <h3>{t('contributor')}</h3>
      <p>{t('contributorIntro')}</p>
      <ul>
        <li>{t('contributorItem1')}</li>
        <li>{t('contributorItem2')}</li>
        <li>{t('contributorItem3')}</li>
        <li>{t('contributorItem4')}</li>
        <li>{t('contributorItem5')}</li>
      </ul>

      <h3>{t('observer')}</h3>
      <p>{t('observerIntro')}</p>
      <ul>
        <li>{t('observerItem1')}</li>
        <li>{t('observerItem2')}</li>
        <li>{t('observerItem3')}</li>
        <li>{t('observerItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('rolePermissionsImageTitle')}
        description={t('rolePermissionsImageDesc')}
      />

      <h2>{t('invitingTeamMembersTitle')}</h2>

      <h3>{t('singleInvitationTitle')}</h3>
      <p>{t('singleInvitationIntro')}</p>
      <ol>
        <li>{t('singleInvitationItem1')}</li>
        <li>{t('singleInvitationItem2')}</li>
        <li>{t('singleInvitationItem3')}</li>
        <li>{t('singleInvitationItem4')}</li>
      </ol>
      <p>
        {t('singleInvitationDesc')}
      </p>

      <h3>{t('bulkInvitationTitle')}</h3>
      <p>{t('bulkInvitationIntro')}</p>
      <ol>
        <li>{t('bulkInvitationItem1')}</li>
        <li>{t('bulkInvitationItem2')}</li>
        <li>{t('bulkInvitationItem3')}</li>
        <li>{t('bulkInvitationItem4')}</li>
      </ol>

      <PlaceholderImage
        title={t('invitationModalImageTitle')}
        description={t('invitationModalImageDesc')}
      />

      <h2>{t('managingInvitationsTitle')}</h2>
      <p>{t('managingInvitationsDesc')}</p>
      <ul>
        <li>
          <strong>{t('invitedBy')}</strong>: {t('invitedByDesc')}
        </li>
        <li>
          <strong>{t('invitationDate')}</strong>: {t('invitationDateDesc')}
        </li>
        <li>
          <strong>{t('status')}</strong>: {t('statusDesc2')}
        </li>
      </ul>
      <p>
        {t('managingInvitationsNote')}
      </p>

      <h2>{t('memberActionsTitle')}</h2>

      <h3>{t('viewDetailsTitle')}</h3>
      <p>
        {t('viewDetailsDesc')}
      </p>

      <h3>{t('editPermissionsTitle')}</h3>
      <p>
        {t('editPermissionsDesc')}
      </p>

      <h3>{t('removeFromProjectTitle')}</h3>
      <p>{t('removeFromProjectIntro')}</p>
      <ol>
        <li>{t('removeFromProjectItem1')}</li>
        <li>{t('removeFromProjectItem2')}</li>
        <li>{t('removeFromProjectItem3')}</li>
      </ol>
      <p>
        <strong>{t('note')}</strong>: {t('removeFromProjectNote')}
      </p>

      <h2>{t('dataExportTitle')}</h2>
      <p>{t('dataExportIntro')}</p>
      <ul>
        <li>{t('dataExportItem1')}</li>
        <li>{t('dataExportItem2')}</li>
        <li>{t('dataExportItem3')}</li>
      </ul>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('roleAssignmentTitle')}</h3>
      <ul>
        <li>
          <strong>{t('principleOfLeastPrivilege')}</strong>: {t('principleOfLeastPrivilegeDesc')}
        </li>
        <li>
          <strong>{t('limitAdmins')}</strong>: {t('limitAdminsDesc')}
        </li>
        <li>
          <strong>{t('useObserverWisely')}</strong>: {t('useObserverWiselyDesc')}
        </li>
      </ul>

      <h3>{t('teamOrganizationTitle')}</h3>
      <ul>
        <li>
          <strong>{t('regularReview')}</strong>: {t('regularReviewDesc')}
        </li>
        <li>
          <strong>{t('documentRoles')}</strong>: {t('documentRolesDesc')}
        </li>
        <li>
          <strong>{t('onboarding')}</strong>: {t('onboardingDesc')}
        </li>
      </ul>

      <h3>{t('securityTitle')}</h3>
      <ul>
        <li>
          <strong>{t('verifyEmails')}</strong>: {t('verifyEmailsDesc')}
        </li>
        <li>
          <strong>{t('promptRemoval')}</strong>: {t('promptRemovalDesc')}
        </li>
        <li>
          <strong>{t('auditAccess')}</strong>: {t('auditAccessDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/team-collaboration`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/sites-management`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/reports`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
