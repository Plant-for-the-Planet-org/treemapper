import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function SpeciesManagementPage() {
  return (
    <DocPage
      title="Species Management"
      description="Learn how to manage tree species in the TreeMapper web dashboard."
      pageId="species-management"
    >
      <h2>Overview</h2>
      <p>
        The Species Management section allows you to manage the tree species used in your
        restoration project. You can add species from a scientific database, handle unknown species
        from field data, and organize species with metadata and images.
      </p>

      <h2>Species Types</h2>
      <p>TreeMapper handles two categories of species:</p>

      <h3>Scientific Species</h3>
      <p>
        Species from the predefined scientific database with verified taxonomic information. These
        species have:
      </p>
      <ul>
        <li>Validated scientific names</li>
        <li>Common names in multiple languages</li>
        <li>Taxonomic classification</li>
        <li>Standard metadata</li>
      </ul>

      <h3>Unknown Species</h3>
      <p>
        Species recorded in field interventions that haven't been matched to the scientific
        database. These appear when:
      </p>
      <ul>
        <li>Field workers couldn't identify a species</li>
        <li>Local names don't match database entries</li>
        <li>New species variants are encountered</li>
      </ul>
      <p>
        Unknown species can be assigned to scientific species once identified, maintaining data
        integrity.
      </p>

      <PlaceholderImage
        title="Species Grid"
        description="Screenshot showing the species management grid view"
      />

      <h2>Viewing Species</h2>
      <p>Species are displayed in a grid view showing cards for each species:</p>

      <h3>Species Card Information</h3>
      <ul>
        <li>
          <strong>Species image</strong>: Thumbnail photo of the species
        </li>
        <li>
          <strong>Scientific name</strong>: Latin binomial nomenclature
        </li>
        <li>
          <strong>Common name</strong>: Local or vernacular name
        </li>
        <li>
          <strong>Usage count</strong>: How many trees of this species exist
        </li>
        <li>
          <strong>Intervention count</strong>: Number of interventions using this species
        </li>
        <li>
          <strong>Status</strong>: Active or Disabled
        </li>
        <li>
          <strong>Favorite indicator</strong>: Star icon for frequently used species
        </li>
      </ul>

      <h2>Search and Filter</h2>
      <p>Find species quickly using comprehensive search and filter options:</p>

      <h3>Search</h3>
      <p>Search by scientific name, common name, or intervention ID.</p>

      <h3>Filter Options</h3>
      <ul>
        <li>
          <strong>Species type</strong>: Scientific or Unknown
        </li>
        <li>
          <strong>Source</strong>: Project, Intervention, or Both
        </li>
        <li>
          <strong>Intervention type</strong>: Filter by associated intervention type
        </li>
        <li>
          <strong>Show disabled</strong>: Toggle to include or hide disabled species
        </li>
      </ul>

      <h3>Sorting</h3>
      <p>Sort species by:</p>
      <ul>
        <li>Name (alphabetical)</li>
        <li>Date added</li>
        <li>Favorite status</li>
        <li>Intervention count (most/least used)</li>
      </ul>

      <PlaceholderImage
        title="Species Filters"
        description="Screenshot showing the species filter and search options"
      />

      <h2>Species Details</h2>
      <p>Click on a species to view its full details:</p>

      <h3>Basic Information</h3>
      <ul>
        <li>Scientific name and common names</li>
        <li>Description and notes</li>
        <li>Species image (full size)</li>
        <li>Native species indicator</li>
      </ul>

      <h3>Metadata</h3>
      <ul>
        <li>
          <strong>Habitat</strong>: Natural environment type
        </li>
        <li>
          <strong>Height</strong>: Typical mature height
        </li>
        <li>
          <strong>Flowers</strong>: Flowering characteristics
        </li>
        <li>
          <strong>Blooming season</strong>: When the species flowers
        </li>
      </ul>

      <h3>Usage Statistics</h3>
      <ul>
        <li>Total trees planted of this species</li>
        <li>Number of interventions where used</li>
        <li>Distribution across sites</li>
        <li>Data sources (project level, field collected)</li>
      </ul>

      <h2>Adding Species</h2>

      <h3>From Scientific Database</h3>
      <p>To add a new species to your project:</p>
      <ol>
        <li>Click "Add Species"</li>
        <li>Search the scientific species database</li>
        <li>Select the species from search results</li>
        <li>Add project-specific metadata (optional)</li>
        <li>Upload a species image (optional)</li>
        <li>Save to add to your project</li>
      </ol>

      <h3>Requesting New Species</h3>
      <p>If a species isn't in the database, you can request it be added:</p>
      <ol>
        <li>Click "Request Species"</li>
        <li>Provide the scientific name</li>
        <li>Add common name and description</li>
        <li>Explain the reason for the request</li>
        <li>Submit for review</li>
      </ol>

      <PlaceholderImage
        title="Add Species"
        description="Screenshot showing the add species modal"
      />

      <h2>Editing Species</h2>
      <p>Modify species information for your project:</p>

      <h3>Editable Fields</h3>
      <ul>
        <li>Common name (local names)</li>
        <li>Description and notes</li>
        <li>Species image</li>
        <li>Favorite status</li>
        <li>Enabled/Disabled status</li>
        <li>Metadata (habitat, height, flowers, blooming season)</li>
      </ul>

      <h3>Image Management</h3>
      <p>Upload and manage species images:</p>
      <ul>
        <li>Upload new images</li>
        <li>Replace existing images</li>
        <li>Remove images if needed</li>
      </ul>

      <h2>Managing Unknown Species</h2>
      <p>Unknown species from field data need to be classified:</p>

      <h3>Individual Assignment</h3>
      <ol>
        <li>Open the unknown species details</li>
        <li>Search for the matching scientific species</li>
        <li>Assign the unknown to the scientific species</li>
        <li>All records are updated to reflect the correct species</li>
      </ol>

      <h3>Bulk Assignment</h3>
      <p>For multiple unknown species:</p>
      <ol>
        <li>Select multiple unknown species</li>
        <li>Choose "Assign Scientific Species"</li>
        <li>Search and select the correct species</li>
        <li>Apply to all selected unknowns</li>
      </ol>

      <PlaceholderImage
        title="Species Assignment"
        description="Screenshot showing unknown species assignment"
      />

      <h2>Species Status</h2>

      <h3>Active Species</h3>
      <p>
        Species available for selection in the mobile app and web dashboard when creating
        interventions.
      </p>

      <h3>Disabled Species</h3>
      <p>
        Species hidden from selection but retained for historical records. Disable species that:
      </p>
      <ul>
        <li>Are no longer used in your project</li>
        <li>Were added by mistake</li>
        <li>Are duplicates of other entries</li>
      </ul>
      <p>
        <strong>Note:</strong> Disabling doesn't delete the species or affect existing records.
      </p>

      <h2>Favorites</h2>
      <p>Mark frequently used species as favorites for quick access:</p>
      <ul>
        <li>Click the star icon to toggle favorite status</li>
        <li>Favorites appear first when sorted by favorite status</li>
        <li>Makes common species easier to find in long lists</li>
      </ul>

      <h2>Deleting Species</h2>
      <p>
        Species can only be deleted if they're not used in any interventions:
      </p>
      <ul>
        <li>Check that no interventions reference the species</li>
        <li>Click delete and confirm</li>
        <li>The species is permanently removed</li>
      </ul>
      <p>
        If a species is in use, consider disabling it instead of deleting.
      </p>

      <h2>Data Export</h2>
      <p>Export your species list for reporting or backup:</p>
      <ul>
        <li>Click the export option</li>
        <li>Download a CSV file with all species information</li>
        <li>Includes metadata and usage statistics</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>Species Organization</h3>
      <ul>
        <li>
          <strong>Standardize names</strong>: Use consistent common names across your team
        </li>
        <li>
          <strong>Add images</strong>: Photos help field workers identify species correctly
        </li>
        <li>
          <strong>Use favorites</strong>: Mark common species for quick access
        </li>
        <li>
          <strong>Review unknowns</strong>: Regularly classify unknown species
        </li>
      </ul>

      <h3>Data Quality</h3>
      <ul>
        <li>
          <strong>Verify scientific names</strong>: Ensure correct taxonomy
        </li>
        <li>
          <strong>Document local names</strong>: Record regional variations
        </li>
        <li>
          <strong>Add metadata</strong>: Complete species profiles aid identification
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/managing-species">Managing Species Tutorial</Link>
        </li>
        <li>
          <Link href="/docs/mobile/creating-interventions">Creating Interventions</Link>
        </li>
        <li>
          <Link href="/docs/concepts/data-export">Data Export</Link>
        </li>
      </ul>
    </DocPage>
  );
}
