import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function PlotManagementPage() {
  return (
    <DocPage
      title="Plot Management"
      description="Learn how to create and manage monitoring plots in the TreeMapper mobile app."
      pageId="plot-management"
    >
      <h2>Overview</h2>
      <p>
        Monitoring plots are defined areas within your restoration sites used for systematic,
        long-term data collection. TreeMapper's mobile app provides comprehensive tools for creating
        plots, managing plot groups, and tracking individual plants within plots over time.
      </p>

      <h2>Plot Types</h2>
      <p>TreeMapper supports two types of monitoring plots:</p>

      <h3>Intervention Plots</h3>
      <p>
        Plots located within areas where restoration activities have been performed. Use these to
        monitor the success and growth of planted trees.
      </p>

      <h3>Control Plots</h3>
      <p>
        Plots in areas without intervention, used as a baseline for comparison. Control plots help
        you measure the impact of your restoration efforts by comparing treated and untreated areas.
      </p>

      <h2>Plot Shapes</h2>
      <p>Plots can be defined in two shapes, each suited to different monitoring methodologies:</p>

      <h3>Circular Plots</h3>
      <ul>
        <li>Defined by a center point and radius</li>
        <li>Common in forestry sampling protocols</li>
        <li>Easy to establish in the field using a measuring tape from center</li>
        <li>Area calculated automatically from radius</li>
      </ul>

      <h3>Rectangular Plots</h3>
      <ul>
        <li>Defined by length and width dimensions</li>
        <li>Useful for systematic grid-based sampling</li>
        <li>Easy to subdivide into smaller sampling units</li>
        <li>Area calculated from length x width</li>
      </ul>

      <PlaceholderImage
        title="Plot Shapes"
        description="Diagram showing circular and rectangular plot configurations"
      />

      <h2>Plot Complexity</h2>
      <p>When creating a plot, you can choose between two complexity levels:</p>

      <h3>Standard Plots</h3>
      <p>
        Full-featured plots with comprehensive data collection options including nested subplots,
        detailed measurements, and environmental observations.
      </p>

      <h3>Simple Plots</h3>
      <p>
        Streamlined plots for basic monitoring with fewer data fields. Ideal for quick assessments
        or when detailed monitoring isn't required.
      </p>

      <h2>Creating a Plot</h2>
      <p>Follow these steps to create a new monitoring plot:</p>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title="Select Plot Options"
          description="Choose plot complexity (Standard/Simple), shape (Circular/Rectangular), and type (Intervention/Control)"
        />
        <WorkflowStep
          number={2}
          title="Enter Plot Details"
          description="Provide plot name, dimensions (radius or length/width), and any identification information"
        />
        <WorkflowStep
          number={3}
          title="Mark Location on Map"
          description="Use the map interface to draw or position your plot boundary"
        />
        <WorkflowStep
          number={4}
          title="Add Documentation"
          description="Take photos of the plot area for reference"
        />
        <WorkflowStep
          number={5}
          title="Save Plot"
          description="Confirm and save the plot to begin data collection"
        />
      </div>

      <PlaceholderImage
        title="Plot Creation"
        description="Screenshots showing the plot creation workflow"
      />

      <h3>Drawing Plot Boundaries</h3>
      <p>When marking the plot location on the map:</p>
      <ul>
        <li>
          <strong>For circular plots</strong>: Tap to set the center point, then adjust the radius
        </li>
        <li>
          <strong>For rectangular plots</strong>: Draw the corners or drag to position and resize
        </li>
        <li>The app automatically calculates dimensions and area based on your drawing</li>
        <li>You can manually adjust dimensions after drawing for precise measurements</li>
      </ul>

      <h2>Managing Plants in Plots</h2>
      <p>
        Once a plot is created, you can track individual plants within it. Each plant record
        includes:
      </p>

      <h3>Plant Information</h3>
      <ul>
        <li>
          <strong>Species</strong>: Scientific name and local/common name
        </li>
        <li>
          <strong>Tag</strong>: Unique identifier for the plant
        </li>
        <li>
          <strong>Type</strong>: Classification of the plant
        </li>
        <li>
          <strong>Quantity</strong>: Number of individuals (for grouped plants)
        </li>
        <li>
          <strong>Location</strong>: GPS coordinates within the plot
        </li>
        <li>
          <strong>Status</strong>: Current condition (Alive, Deceased, etc.)
        </li>
      </ul>

      <h3>Adding Plants to a Plot</h3>
      <ul>
        <li>Open the plot details</li>
        <li>Tap to add a new plant</li>
        <li>Select or search for the species</li>
        <li>Mark the plant's location within the plot</li>
        <li>Add measurements and photos</li>
        <li>Save the plant record</li>
      </ul>

      <h2>Plot Groups</h2>
      <p>
        Organize related plots into groups for easier management. Plot groups are useful when you
        have multiple plots that are part of the same monitoring design or sampling strategy.
      </p>

      <h3>Creating a Plot Group</h3>
      <ul>
        <li>Navigate to plot groups section</li>
        <li>Create a new group with a descriptive name</li>
        <li>Add existing plots to the group</li>
        <li>Manage group membership as needed</li>
      </ul>

      <h3>Benefits of Plot Groups</h3>
      <ul>
        <li>
          <strong>Organization</strong>: Keep related plots together
        </li>
        <li>
          <strong>Reporting</strong>: Aggregate data across grouped plots
        </li>
        <li>
          <strong>Workflow</strong>: Easily find and work with related plots
        </li>
      </ul>

      <h2>Plant Timeline</h2>
      <p>
        TreeMapper maintains a complete history of each plant in your plots. The plant timeline
        shows:
      </p>
      <ul>
        <li>Initial recording date and measurements</li>
        <li>All subsequent remeasurements</li>
        <li>Growth trends over time</li>
        <li>Status changes (if plant died or was damaged)</li>
        <li>Photos from each measurement session</li>
      </ul>

      <PlaceholderImage
        title="Plant Timeline"
        description="Screenshot showing plant measurement history"
      />

      <h2>Plot Observations</h2>
      <p>
        In addition to plant data, you can record environmental observations for each plot. These
        observations help document site conditions and factors that may affect plant growth.
      </p>

      <h2>Managing Plots</h2>

      <h3>Editing Plots</h3>
      <p>
        You can update plot information including name, dimensions, and other details. Changes are
        tracked with timestamps for audit purposes.
      </p>

      <h3>Deleting Plots</h3>
      <p>
        Plots can be deleted if no longer needed. Note that deleting a plot will also remove all
        associated plant records, so use this option carefully.
      </p>

      <h2>Best Practices</h2>
      <ul>
        <li>
          <strong>Consistent naming</strong>: Use a systematic naming convention for plots (e.g.,
          Site-Plot-Number)
        </li>
        <li>
          <strong>Accurate boundaries</strong>: Take time to precisely mark plot boundaries for
          consistent data collection
        </li>
        <li>
          <strong>Regular monitoring</strong>: Establish a schedule for revisiting plots to collect
          growth data
        </li>
        <li>
          <strong>Photo documentation</strong>: Take overview photos of each plot during every visit
        </li>
        <li>
          <strong>Tag plants</strong>: Use physical tags in the field to match digital records
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/plots">Plots & Plot Groups Concept</Link>
        </li>
        <li>
          <Link href="/docs/mobile/measurements">Taking Measurements</Link>
        </li>
        <li>
          <Link href="/docs/concepts/remeasurement">Remeasurement</Link>
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
