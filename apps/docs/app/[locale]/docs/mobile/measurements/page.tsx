import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function MeasurementsPage() {
  return (
    <DocPage
      title="Taking Measurements"
      description="Learn how to accurately measure trees using the TreeMapper mobile app."
      pageId="measurements"
    >
      <h2>Overview</h2>
      <p>
        Accurate tree measurements are essential for tracking growth and assessing the success of
        your restoration efforts. TreeMapper provides tools for recording height, diameter, and
        other metrics with built-in validation to ensure data quality.
      </p>

      <h2>Measurement Types</h2>

      <h3>Height/Length</h3>
      <p>
        Tree height is measured from the ground to the top of the tree. TreeMapper supports
        different units based on your location:
      </p>
      <ul>
        <li>
          <strong>Metric countries (ISU)</strong>: Enter height in meters
        </li>
        <li>
          <strong>Non-metric countries</strong>: Enter height in feet (automatically converted to
          meters for storage)
        </li>
      </ul>

      <PlaceholderImage
        title="Height Measurement"
        description="Diagram showing how to measure tree height from ground to crown"
      />

      <h3>Diameter Measurements</h3>
      <p>
        TreeMapper automatically determines which diameter measurement to use based on tree height:
      </p>

      <h4>Diameter at Breast Height (DBH)</h4>
      <p>For trees taller than 1.3 meters (4.3 feet):</p>
      <ul>
        <li>Measured at 1.3 meters (breast height) above the ground</li>
        <li>Standard forestry measurement for established trees</li>
        <li>Entered in centimeters (metric) or inches (non-metric)</li>
      </ul>

      <h4>Basal Diameter</h4>
      <p>For trees shorter than 1.3 meters:</p>
      <ul>
        <li>Measured at the base of the tree, near ground level</li>
        <li>Used for seedlings and young trees</li>
        <li>Same unit options as DBH</li>
      </ul>

      <p>
        The app automatically switches between "DBH" and "Basal Diameter" labels based on the height
        you enter, ensuring the correct measurement protocol is followed.
      </p>

      <PlaceholderImage
        title="Diameter Measurement Points"
        description="Diagram showing DBH measurement at 1.3m vs basal diameter at ground level"
      />

      <h2>Taking Measurements</h2>
      <p>When adding measurements to a tree, follow these steps:</p>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title="Enter Height"
          description="Input the tree height in the appropriate unit for your region"
        />
        <WorkflowStep
          number={2}
          title="Enter Diameter"
          description="Input DBH (for trees >1.3m) or basal diameter (for shorter trees)"
        />
        <WorkflowStep
          number={3}
          title="Add Tree Tag (Optional)"
          description="Enable the tag switch and enter an alphanumeric tag ID if using physical tags"
        />
        <WorkflowStep
          number={4}
          title="Take Photo"
          description="Capture a photo of the tree for visual documentation"
        />
        <WorkflowStep
          number={5}
          title="Save Measurements"
          description="Confirm and save the measurement record"
        />
      </div>

      <h2>Measurement Validation</h2>
      <p>
        TreeMapper includes built-in validation to help ensure your measurements are botanically
        reasonable:
      </p>

      <h3>Height-to-Diameter Ratio</h3>
      <p>
        The app checks the ratio between height and diameter to identify potentially erroneous
        measurements. If the ratio falls outside expected ranges for typical trees, you'll see an
        alert.
      </p>

      <h4>What Happens When Validation Fails?</h4>
      <ul>
        <li>An alert appears explaining the potential issue</li>
        <li>You can review and correct your measurements</li>
        <li>You can choose to save anyway if the measurements are accurate for an unusual tree</li>
      </ul>

      <h3>Input Validation</h3>
      <ul>
        <li>Values must be positive numbers</li>
        <li>Decimal format is supported (e.g., 2.5 meters)</li>
        <li>Empty values are not allowed for required fields</li>
      </ul>

      <h2>Tree Tags</h2>
      <p>
        Tree tags provide a physical-to-digital link for tracking individual trees in the field:
      </p>
      <ul>
        <li>Toggle the tag switch to enable tag input</li>
        <li>Enter an alphanumeric tag ID that matches the physical tag on the tree</li>
        <li>Tags must be unique within the intervention</li>
        <li>Use consistent tagging protocols across your project</li>
      </ul>

      <PlaceholderImage
        title="Tree Tag Input"
        description="Screenshot showing the tree tag input field"
      />

      <h2>Location Data</h2>
      <p>
        When you take measurements, TreeMapper automatically captures your current GPS location.
        This provides:
      </p>
      <ul>
        <li>Geographic reference for the measured tree</li>
        <li>Location accuracy information</li>
        <li>Timestamp of the measurement</li>
      </ul>

      <h2>Unit Conversion</h2>
      <p>
        TreeMapper handles unit conversion automatically to ensure data consistency across all
        users:
      </p>

      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">Measurement</th>
              <th className="border border-border px-4 py-2 text-left">Input Unit</th>
              <th className="border border-border px-4 py-2 text-left">Stored Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-4 py-2">Height (Metric)</td>
              <td className="border border-border px-4 py-2">Meters</td>
              <td className="border border-border px-4 py-2">Meters</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Height (Non-metric)</td>
              <td className="border border-border px-4 py-2">Feet</td>
              <td className="border border-border px-4 py-2">Meters</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Diameter (Metric)</td>
              <td className="border border-border px-4 py-2">Centimeters</td>
              <td className="border border-border px-4 py-2">Centimeters</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Diameter (Non-metric)</td>
              <td className="border border-border px-4 py-2">Inches</td>
              <td className="border border-border px-4 py-2">Centimeters</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Best Practices for Accurate Measurements</h2>

      <h3>Height Measurement Tips</h3>
      <ul>
        <li>
          <strong>Use proper tools</strong>: A clinometer or hypsometer improves accuracy for tall
          trees
        </li>
        <li>
          <strong>Stand at known distance</strong>: Position yourself at a consistent distance from
          the tree
        </li>
        <li>
          <strong>Identify the top</strong>: Clearly identify the highest point of the crown
        </li>
        <li>
          <strong>Account for slope</strong>: Measure from the uphill side on slopes
        </li>
      </ul>

      <h3>Diameter Measurement Tips</h3>
      <ul>
        <li>
          <strong>Use a diameter tape</strong>: D-tapes give direct diameter readings from
          circumference
        </li>
        <li>
          <strong>Measure perpendicular</strong>: Hold the tape perpendicular to the tree trunk
        </li>
        <li>
          <strong>Avoid irregularities</strong>: If there's a bulge or damage at breast height,
          measure slightly above or below
        </li>
        <li>
          <strong>Record multiple stems</strong>: For multi-stemmed trees, measure each stem
          separately
        </li>
      </ul>

      <h3>General Tips</h3>
      <ul>
        <li>
          <strong>Be consistent</strong>: Use the same measurement technique across all trees
        </li>
        <li>
          <strong>Double-check unusual values</strong>: Re-measure if numbers seem off
        </li>
        <li>
          <strong>Document conditions</strong>: Note any factors affecting measurement accuracy
        </li>
        <li>
          <strong>Take photos</strong>: Photos provide visual verification of measurements
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/remeasurement">Remeasurement</Link>
        </li>
        <li>
          <Link href="/docs/mobile/photo-documentation">Photo Documentation</Link>
        </li>
        <li>
          <Link href="/docs/mobile/creating-interventions">Creating Interventions</Link>
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
