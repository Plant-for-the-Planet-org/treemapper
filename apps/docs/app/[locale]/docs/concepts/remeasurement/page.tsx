import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function RemeasurementPage() {
  return (
    <DocPage
      title="Remeasurement"
      description="Learn how to track tree growth over time by remeasuring trees in TreeMapper."
      pageId="remeasurement"
    >
      <h2>Overview</h2>
      <p>
        Using TreeMapper, you can <strong>remeasure trees over time</strong> to track their growth
        and health. Both <strong>sample trees</strong> and <strong>single trees</strong> can be
        remeasured, allowing you to build a comprehensive history of each tree's development.
      </p>

      <h2>How to Remeasure a Tree</h2>
      <p>Follow these steps to remeasure a tree from the mobile app:</p>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title="Select Intervention"
          description="Open the mobile app and tap on the intervention containing the tree you want to remeasure"
        />
        <WorkflowStep
          number={2}
          title="Select Tree"
          description="Choose the specific tree you want to remeasure from the intervention"
        />
        <WorkflowStep
          number={3}
          title="Choose Measure"
          description="Select the 'Measure' option to record new measurements"
        />
        <WorkflowStep
          number={4}
          title="Add Details"
          description="Enter the measurement details (height, diameter, etc.) and add an updated photo"
        />
        <WorkflowStep
          number={5}
          title="Complete"
          description="Save the remeasurement to complete the process"
        />
      </div>

      <PlaceholderImage
        title="Remeasurement Flow"
        description="Screenshots showing the step-by-step remeasurement process in the mobile app"
      />

      <h2>Recording Dead Trees</h2>
      <p>
        If a tree has died, you can record this using the same workflow. Instead of adding new
        measurements:
      </p>
      <ul>
        <li>Select the tree from the intervention</li>
        <li>
          Choose <strong>"Tree is Dead"</strong> option
        </li>
        <li>Provide the reason for the tree's death</li>
        <li>Add any additional comments or observations</li>
        <li>Optionally add a photo documenting the condition</li>
      </ul>

      <p>
        This helps maintain accurate records of tree survival rates and identify potential issues
        affecting your restoration sites.
      </p>

      <h2>Measurement History</h2>
      <p>
        All tree remeasurements are stored as a <strong>history/timeline</strong> and attached to
        that specific tree. You can view the complete measurement history from the{' '}
        <strong>tree details section</strong>, which shows:
      </p>
      <ul>
        <li>Date of each measurement</li>
        <li>Growth metrics over time (height, diameter, etc.)</li>
        <li>Photos from each measurement session</li>
        <li>Health status changes</li>
        <li>Any recorded issues or deaths</li>
      </ul>

      <PlaceholderImage
        title="Tree Timeline"
        description="Screenshot showing the measurement history timeline for a tree"
      />

      <h2>Remeasurement Reminders</h2>
      <p>
        TreeMapper can help you stay on schedule with your monitoring activities. From the mobile
        app, you can enable <strong>tree remeasurement periodicity and frequency</strong> settings:
      </p>
      <ul>
        <li>Set how often trees should be remeasured (monthly, quarterly, annually, etc.)</li>
        <li>Receive notifications when it's time to remeasure</li>
        <li>Never miss a scheduled monitoring session</li>
      </ul>

      <h2>Identifying Trees Due for Remeasurement</h2>
      <p>TreeMapper makes it easy to find trees that need remeasurement:</p>

      <h3>Visual Indicators on Map</h3>
      <p>
        All trees that are due for remeasurement will turn <strong>red</strong> on the map. This
        visual indicator helps you quickly identify which trees need attention without having to
        check each one individually.
      </p>

      <h3>Location Feature</h3>
      <p>
        Use the <strong>location feature</strong> to navigate to trees that require remeasurement.
        This is especially useful in large sites where trees may be spread across a wide area.
      </p>

      <PlaceholderImage
        title="Trees Due for Remeasurement"
        description="Map view showing trees highlighted in red that are due for remeasurement"
      />

      <h2>Best Practices</h2>
      <ul>
        <li>
          <strong>Consistent timing</strong>: Try to remeasure at the same time of year for
          comparable growth data
        </li>
        <li>
          <strong>Photo documentation</strong>: Always include updated photos to visually track
          changes
        </li>
        <li>
          <strong>Note conditions</strong>: Record any observations about tree health, pests, or
          environmental factors
        </li>
        <li>
          <strong>Regular schedule</strong>: Set up remeasurement reminders to maintain consistent
          monitoring
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/interventions">Understanding Interventions</Link>
        </li>
        <li>
          <Link href="/docs/concepts/plots">Plots & Plot Groups</Link>
        </li>
        <li>
          <Link href="/docs/mobile/measurements">Taking Measurements</Link>
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
