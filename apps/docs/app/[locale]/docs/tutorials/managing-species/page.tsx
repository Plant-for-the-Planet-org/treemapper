import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function ManagingSpeciesPage() {
  return (
    <DocPage
      title="Managing Species"
      description="Learn how to manage tree species in TreeMapper on mobile and on the web dashboard."
      pageId="managing-species"
    >
      <p>
        Species management is where you review, customize, and organize the species you use during
        intervention registration (for example during tree planting).
      </p>

      <p>
        TreeMapper downloads the species list during installation from the Plant-for-the-Planet
        database. It includes <strong>60,000+ species</strong> covering the most planted species.
        Once downloaded, the species list remains available <strong>offline</strong> in the mobile
        app.
      </p>

      <PlaceholderImage
        title="Species List"
        description="Screenshot showing the species list in the TreeMapper mobile app"
        aspectRatio="portrait"
      />

      <h2>Where You Can Manage Species</h2>
      <ul>
        <li>
          <strong>Mobile App</strong>: Manage species directly on your device (works offline once
          downloaded)
        </li>
        <li>
          <strong>Web Dashboard</strong>: Manage species with more powerful filters and controls
        </li>
      </ul>

      <h2>Managing Species in the Mobile App (Offline-Friendly)</h2>
      <p>
        In the mobile app, species are available even without internet once they’ve been downloaded.
        You can customize species data locally to better match your field workflows.
      </p>

      <p>From the mobile app, you can:</p>
      <ul>
        <li>
          Update the <strong>local name</strong>
        </li>
        <li>
          Add more <strong>description</strong> or notes
        </li>
        <li>
          Add a <strong>custom image</strong>
        </li>
        <li>
          Mark a species as a <strong>favorite</strong> so it’s easy to find during planting
          registration
        </li>
      </ul>

      <PlaceholderImage
        title="Edit Species"
        description="Screenshot showing species details editing (local name, description, image, favorite)"
        aspectRatio="portrait"
      />

      <h2>Managing Species in the Web Dashboard</h2>
      <p>
        You can also manage species from the web dashboard. This is especially useful when working
        with large lists, because the web dashboard provides <strong>more filters</strong> for
        browsing and managing species.
      </p>

      <p>
        The same types of updates (like local naming, descriptions, images, and favorites) can be
        managed from the web dashboard as well.
      </p>

      <h2>Species Not Found? Request It</h2>
      <p>
        Plant-for-the-Planet maintains the core database of the most planted species. If you can’t
        find a species you need, you can request it to be added.
      </p>

      <p>
        To request a species, open the web dashboard and submit a request. The team will review it
        and add it to the database if appropriate.
      </p>

      <h2>What's Next?</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/first-intervention">Create your first intervention</Link> and
          use species during registration
        </li>
        <li>
          <Link href="/docs/tutorials/monitoring-plots">Set up monitoring plots</Link> to track
          planted and recruited plants over time
        </li>
      </ul>
    </DocPage>
  );
}

