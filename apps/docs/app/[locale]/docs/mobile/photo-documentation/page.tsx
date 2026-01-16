import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function PhotoDocumentationPage() {
  return (
    <DocPage
      title="Photo Documentation"
      description="Learn how to capture and manage photos in the TreeMapper mobile app."
      pageId="photo-documentation"
    >
      <h2>Overview</h2>
      <p>
        Photo documentation is a critical component of restoration monitoring. TreeMapper's
        integrated camera allows you to capture photos directly within the app, automatically
        linking them to interventions, trees, and plots for comprehensive visual records.
      </p>

      <h2>Camera Features</h2>
      <p>TreeMapper uses your device's native camera with optimized settings for field documentation:</p>
      <ul>
        <li>
          <strong>Real-time preview</strong>: See exactly what you're capturing before taking the
          photo
        </li>
        <li>
          <strong>Auto-focus</strong>: Automatic focus adjustment for clear images
        </li>
        <li>
          <strong>Metadata capture</strong>: Automatic recording of image dimensions and properties
        </li>
        <li>
          <strong>GPS tagging</strong>: Location coordinates captured with each photo
        </li>
      </ul>

      <PlaceholderImage
        title="Camera Interface"
        description="Screenshot of the TreeMapper camera interface"
      />

      <h2>Taking Photos</h2>
      <p>The photo capture workflow is straightforward:</p>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title="Open Camera"
          description="The camera opens automatically when photos are needed during data entry"
        />
        <WorkflowStep
          number={2}
          title="Frame Your Subject"
          description="Position the camera to capture the tree, plot, or site clearly"
        />
        <WorkflowStep
          number={3}
          title="Capture Photo"
          description="Tap the capture button to take the photo"
        />
        <WorkflowStep
          number={4}
          title="Review Preview"
          description="Review the captured image in the preview screen"
        />
        <WorkflowStep
          number={5}
          title="Confirm or Retake"
          description="Choose to continue with the photo or retake if needed"
        />
      </div>

      <h2>Image Preview</h2>
      <p>After capturing a photo, you'll see a preview screen with options:</p>
      <ul>
        <li>
          <strong>Continue</strong>: Accept the photo and proceed with data entry
        </li>
        <li>
          <strong>Retake</strong>: Discard the photo and capture a new one
        </li>
      </ul>
      <p>
        The preview includes loading states and error handling to ensure your photos are properly
        saved before continuing.
      </p>

      <h2>Photo Contexts</h2>
      <p>TreeMapper captures photos in various contexts throughout the app:</p>

      <h3>Species Photos</h3>
      <p>
        When adding species to an intervention, you can capture photos of the planted trees. These
        photos help document the species and condition at planting time.
      </p>

      <h3>Sample Tree Photos</h3>
      <p>
        Each sample tree can have photos attached during initial registration and subsequent
        remeasurements. This creates a visual timeline of tree growth.
      </p>

      <h3>Plot Photos</h3>
      <p>
        Monitoring plots can include overview photos showing the plot area, vegetation, and site
        conditions.
      </p>

      <h3>Remeasurement Photos</h3>
      <p>
        When remeasuring trees, updated photos document current conditions and growth progress.
      </p>

      <h3>Intervention Photos</h3>
      <p>
        General intervention documentation including before/after photos of the work performed.
      </p>

      <PlaceholderImage
        title="Photo Types"
        description="Examples of different photo types in TreeMapper"
      />

      <h2>Image Storage</h2>
      <p>TreeMapper manages photo storage efficiently:</p>

      <h3>Local Storage</h3>
      <ul>
        <li>Photos are saved to your device's document directory</li>
        <li>Organized by intervention ID or context</li>
        <li>Available offline until synced</li>
      </ul>

      <h3>Cloud Storage</h3>
      <ul>
        <li>Photos sync to the server when internet is available</li>
        <li>CDN URLs are generated for synced images</li>
        <li>Original photos remain on device as backup</li>
      </ul>

      <h3>Storage Tracking</h3>
      <p>
        The app tracks image file sizes to help manage device storage and estimate upload bandwidth
        requirements.
      </p>

      <h2>Photo Data</h2>
      <p>Each photo in TreeMapper includes associated metadata:</p>
      <ul>
        <li>
          <strong>Latitude/Longitude</strong>: GPS coordinates where the photo was taken
        </li>
        <li>
          <strong>Timestamp</strong>: Date and time of capture
        </li>
        <li>
          <strong>Dimensions</strong>: Image width and height
        </li>
        <li>
          <strong>File size</strong>: Size in bytes for storage management
        </li>
        <li>
          <strong>Upload status</strong>: Whether the photo has been synced to the server
        </li>
        <li>
          <strong>CDN URL</strong>: Cloud storage URL after successful upload
        </li>
      </ul>

      <h2>Best Practices for Photo Documentation</h2>

      <h3>Composition</h3>
      <ul>
        <li>
          <strong>Fill the frame</strong>: Get close enough to clearly show the subject
        </li>
        <li>
          <strong>Include context</strong>: Show surrounding area for location reference
        </li>
        <li>
          <strong>Use reference objects</strong>: Include a measuring stick or person for scale
        </li>
        <li>
          <strong>Multiple angles</strong>: Capture different perspectives when possible
        </li>
      </ul>

      <h3>Lighting</h3>
      <ul>
        <li>
          <strong>Avoid direct sun</strong>: Strong shadows can obscure details
        </li>
        <li>
          <strong>Overcast is ideal</strong>: Even lighting shows features clearly
        </li>
        <li>
          <strong>Position sun behind you</strong>: Ensure subject is well-lit
        </li>
      </ul>

      <h3>Technical Quality</h3>
      <ul>
        <li>
          <strong>Hold steady</strong>: Brace against something solid to avoid blur
        </li>
        <li>
          <strong>Clean the lens</strong>: Wipe your camera lens before shooting
        </li>
        <li>
          <strong>Check focus</strong>: Ensure the subject is sharp before capturing
        </li>
        <li>
          <strong>Review immediately</strong>: Check the preview and retake if needed
        </li>
      </ul>

      <h3>Documentation Standards</h3>
      <ul>
        <li>
          <strong>Consistent style</strong>: Use similar framing for comparison over time
        </li>
        <li>
          <strong>Before and after</strong>: Document conditions before and after interventions
        </li>
        <li>
          <strong>Capture issues</strong>: Photograph any problems like disease or damage
        </li>
        <li>
          <strong>Overview shots</strong>: Include wide-angle views of the entire site
        </li>
      </ul>

      <PlaceholderImage
        title="Photo Best Practices"
        description="Examples of good vs poor photo documentation"
      />

      <h2>Troubleshooting</h2>

      <h3>Photo Won't Save</h3>
      <ul>
        <li>Check that you have sufficient device storage</li>
        <li>Ensure the app has camera and storage permissions</li>
        <li>Try closing and reopening the camera</li>
      </ul>

      <h3>Blurry Images</h3>
      <ul>
        <li>Hold the device more steadily</li>
        <li>Ensure adequate lighting</li>
        <li>Clean the camera lens</li>
        <li>Wait for auto-focus to complete before capturing</li>
      </ul>

      <h3>Photos Not Syncing</h3>
      <ul>
        <li>Check your internet connection</li>
        <li>Large photos may take longer to upload</li>
        <li>Try syncing from the intervention list</li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/mobile/measurements">Taking Measurements</Link>
        </li>
        <li>
          <Link href="/docs/mobile/creating-interventions">Creating Interventions</Link>
        </li>
        <li>
          <Link href="/docs/concepts/remeasurement">Remeasurement</Link>
        </li>
        <li>
          <Link href="/docs/concepts/sync-offline">Sync & Offline Mode</Link>
        </li>
      </ul>
    </DocPage>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold mt-0 mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-0">{description}</p>
      </div>
    </div>
  );
}
