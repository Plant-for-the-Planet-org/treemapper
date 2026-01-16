import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function SiteCreationPage() {
  return (
    <DocPage
      title="Creating a Site"
      description="Learn how to create sites in TreeMapper to define where restoration activities take place."
      pageId="site-creation"
    >
      <p>
        <strong>Sites</strong> are the polygon areas where tree plantation (and other restoration
        activities) are going on. A single project can have as many sites as you want.
      </p>

      <PlaceholderImage
        title="Sites Overview"
        description="Screenshot showing the sites list and create site button"
        aspectRatio="portrait"
      />

      <h2>Creating a Site</h2>
      <p>To create a new site:</p>
      <ol>
        <li>Open <strong>Sites</strong></li>
        <li>Tap <strong>Add New Site</strong></li>
        <li>Give the site a <strong>name</strong></li>
        <li>Select what <strong>type</strong> of site it will be</li>
        <li>Define the site boundary (polygon) using one of the methods below</li>
        <li>Save the site</li>
      </ol>

      <h2>Define Site Boundaries</h2>
      <p>You can define the site boundary in two ways:</p>

      <h3>1) Draw a Polygon on the Map</h3>
      <p>
        Draw the polygon over the map to mark the site boundaries. This is useful when you’re in
        the field or when you already know the site area.
      </p>

      <p>
        Sites can also be created using the <strong>mobile app</strong>. The advantage of creating a
        site with the app is that, if you don’t have an accurate GeoJSON of the site, you can{' '}
        <strong>trace the site using mobile GPS</strong> by moving across the border of the site and
        registering the boundary directly from the field.
      </p>

      <PlaceholderImage
        title="Draw Site Polygon"
        description="Screenshot showing polygon drawing for site boundaries"
        aspectRatio="portrait"
      />

      <h3>2) Upload a GeoJSON File</h3>
      <p>
        If you already have the site boundary in GIS format, you can upload a GeoJSON file for the
        site.
      </p>

      <PlaceholderImage
        title="Upload GeoJSON"
        description="Screenshot showing GeoJSON upload for site boundaries"
        aspectRatio="portrait"
      />

      <h2>Site Access Management</h2>
      <p>
        Sites also have access management. You can use this to give limited access to certain sites
        for specific team members.
      </p>

      <p>
        This is useful when a project includes multiple restoration areas and different teams should
        only work on specific sites.
      </p>

      <h2>What's Next?</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/first-intervention">Create interventions</Link> inside your
          site to start recording restoration work
        </li>
        <li>
          <Link href="/docs/tutorials/team-collaboration">Manage your team</Link> and assign access
          through roles and site permissions
        </li>
      </ul>
    </DocPage>
  );
}

