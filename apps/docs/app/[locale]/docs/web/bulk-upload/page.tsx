import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function BulkUploadPage() {
  return (
    <DocPage
      title="Bulk Data Upload"
      description="Learn how to upload large amounts of intervention data using the TreeMapper web dashboard."
      pageId="bulk-upload"
    >
      <h2>Overview</h2>
      <p>
        The bulk upload feature allows you to import large quantities of intervention data from
        spreadsheets or CSV files. This is useful when migrating data from other systems or
        recording historical planting data that wasn't captured in the mobile app.
      </p>

      <h2>When to Use Bulk Upload</h2>
      <ul>
        <li>
          <strong>Historical data</strong>: Import past planting records not recorded in TreeMapper
        </li>
        <li>
          <strong>Data migration</strong>: Move data from other forestry management systems
        </li>
        <li>
          <strong>Large datasets</strong>: Upload hundreds or thousands of records at once
        </li>
        <li>
          <strong>Species data</strong>: Bulk import species and tree information
        </li>
      </ul>

      <h2>Upload Wizard</h2>
      <p>
        The bulk upload process uses a step-by-step wizard to guide you through the import:
      </p>

      <PlaceholderImage
        title="Upload Wizard"
        description="Screenshot showing the bulk upload wizard interface"
      />

      <h3>Step 1: Project and Site Selection</h3>
      <p>
        First, select the target project and optionally a specific site for the imported data:
      </p>
      <ul>
        <li>
          <strong>Project selection</strong>: Choose which project will receive the uploaded data
        </li>
        <li>
          <strong>Site selection</strong>: Optionally assign all uploaded interventions to a
          specific site
        </li>
        <li>The system validates your selections before proceeding</li>
      </ul>

      <h3>Step 2: File Upload</h3>
      <p>
        Upload your data file in CSV or spreadsheet format:
      </p>
      <ul>
        <li>
          <strong>Supported formats</strong>: CSV, Excel (.xlsx)
        </li>
        <li>
          <strong>File parsing</strong>: The system reads and parses your file structure
        </li>
        <li>
          <strong>Column mapping</strong>: Match your file columns to TreeMapper fields
        </li>
        <li>
          <strong>Preview</strong>: See a sample of the data to verify it's correct
        </li>
      </ul>

      <PlaceholderImage
        title="File Upload"
        description="Screenshot showing the file upload interface"
      />

      <h3>Step 3: Data Validation</h3>
      <p>
        The system validates your data before import:
      </p>
      <ul>
        <li>
          <strong>Field validation</strong>: Check that required fields are present and properly
          formatted
        </li>
        <li>
          <strong>Data type verification</strong>: Ensure dates, numbers, and coordinates are valid
        </li>
        <li>
          <strong>Error reporting</strong>: Identify and display any issues with the data
        </li>
        <li>
          <strong>Data preview</strong>: Review the validated data before confirming
        </li>
      </ul>

      <h4>Handling Errors</h4>
      <p>
        If validation errors are found:
      </p>
      <ul>
        <li>The system displays which rows have issues</li>
        <li>Error messages explain what needs to be corrected</li>
        <li>You can go back to fix your file and re-upload</li>
        <li>Some minor issues can be corrected in the preview</li>
      </ul>

      <h3>Step 4: Upload Confirmation</h3>
      <p>
        After successful upload, you'll see a confirmation:
      </p>
      <ul>
        <li>
          <strong>Summary</strong>: Number of records successfully imported
        </li>
        <li>
          <strong>Results</strong>: Details about the uploaded data
        </li>
        <li>
          <strong>Next steps</strong>: Option to start a new upload or return to the dashboard
        </li>
      </ul>

      <h2>Data Requirements</h2>

      <h3>Required Fields</h3>
      <p>Your upload file must include these minimum fields:</p>
      <ul>
        <li>
          <strong>Intervention type</strong>: Type of intervention (planting, maintenance, etc.)
        </li>
        <li>
          <strong>Date</strong>: When the intervention occurred
        </li>
        <li>
          <strong>Location</strong>: GPS coordinates (latitude/longitude) or geometry
        </li>
      </ul>

      <h3>Optional Fields</h3>
      <p>Enhance your data with additional fields:</p>
      <ul>
        <li>Species names and counts</li>
        <li>Tree measurements (height, diameter)</li>
        <li>Notes and observations</li>
        <li>Custom metadata fields</li>
      </ul>

      <h3>File Format Guidelines</h3>
      <ul>
        <li>Use clear, descriptive column headers</li>
        <li>Format dates consistently (ISO format recommended: YYYY-MM-DD)</li>
        <li>Use decimal coordinates for location (e.g., -1.2345, 36.7890)</li>
        <li>Avoid special characters in text fields</li>
        <li>Remove any summary rows or totals from the data</li>
      </ul>

      <h2>Bulk Species Upload</h2>
      <p>
        In addition to intervention data, you can bulk upload species information:
      </p>
      <ul>
        <li>Scientific names and common names</li>
        <li>Species metadata (habitat, height, flowering season)</li>
        <li>Tree counts and distribution data</li>
      </ul>

      <h2>Progress Tracking</h2>
      <p>
        The wizard shows your progress through the upload process:
      </p>
      <ul>
        <li>Visual step indicators show completed, current, and remaining steps</li>
        <li>You can navigate back to previous steps to make corrections</li>
        <li>Data persists across steps so you don't lose your work</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>Before Uploading</h3>
      <ul>
        <li>
          <strong>Clean your data</strong>: Remove duplicates, fix formatting issues, and validate
          coordinates
        </li>
        <li>
          <strong>Test with sample</strong>: Try uploading a small subset first to verify the
          process
        </li>
        <li>
          <strong>Backup original</strong>: Keep a copy of your original file before any
          modifications
        </li>
        <li>
          <strong>Map columns</strong>: Understand how your columns map to TreeMapper fields
        </li>
      </ul>

      <h3>During Upload</h3>
      <ul>
        <li>
          <strong>Review carefully</strong>: Check the data preview at each step
        </li>
        <li>
          <strong>Address errors</strong>: Don't ignore validation warnings - fix issues in your
          source file
        </li>
        <li>
          <strong>Don't refresh</strong>: Avoid refreshing the page during upload
        </li>
      </ul>

      <h3>After Upload</h3>
      <ul>
        <li>
          <strong>Verify results</strong>: Check the dashboard to confirm data appears correctly
        </li>
        <li>
          <strong>Spot check</strong>: Review a sample of uploaded interventions for accuracy
        </li>
        <li>
          <strong>Document</strong>: Keep records of what was uploaded and when
        </li>
      </ul>

      <h2>Troubleshooting</h2>

      <h3>File Won't Upload</h3>
      <ul>
        <li>Check file size limits (contact support for very large files)</li>
        <li>Ensure the file format is supported (CSV or Excel)</li>
        <li>Try saving as CSV if Excel upload fails</li>
      </ul>

      <h3>Validation Errors</h3>
      <ul>
        <li>Review error messages for specific issues</li>
        <li>Check date formats match expected format</li>
        <li>Verify coordinates are valid decimal numbers</li>
        <li>Ensure required fields are not empty</li>
      </ul>

      <h3>Missing Data After Upload</h3>
      <ul>
        <li>Check that you selected the correct project</li>
        <li>Verify the upload completed successfully (reached step 4)</li>
        <li>Refresh the dashboard to see new data</li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/interventions">Understanding Interventions</Link>
        </li>
        <li>
          <Link href="/docs/web/species-management">Species Management</Link>
        </li>
        <li>
          <Link href="/docs/concepts/data-export">Data Export</Link>
        </li>
      </ul>
    </DocPage>
  );
}
