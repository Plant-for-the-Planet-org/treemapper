import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function MonitoringPlotsPage() {
  return (
    <DocPage
      title="Setting Up Monitoring Plots"
      description="Learn how to establish and manage monitoring plots for long-term forest research and tracking."
      pageId="monitoring-plots"
    >
      <p>
        Monitoring Plots in TreeMapper are designed to help restoration teams systematically monitor
        a defined area over time. They enable users to assess how forests and landscapes change as
        a result of restoration activities and to compare areas with and without interventions.
      </p>

      <p>
        Monitoring plots provide a structured way to track plant growth, survival, and environmental
        conditions, supporting long-term, evidence-based restoration monitoring.
      </p>

      <PlaceholderImage
        title="Monitoring Plot Overview"
        description="Screenshot showing monitoring plot interface"
        aspectRatio="portrait"
      />

      <h2>What Is a Monitoring Plot?</h2>
      <p>
        A monitoring plot represents a specific, clearly defined area within a restoration site that
        is observed repeatedly over time. By collecting consistent data from the same area, users
        can understand trends in vegetation growth, species composition, and ecosystem recovery.
      </p>

      <p>Monitoring plots are particularly useful for:</p>
      <ul>
        <li>Measuring the effectiveness of restoration interventions</li>
        <li>Comparing restored areas with untouched or naturally regenerating areas</li>
        <li>Generating reliable, long-term monitoring data</li>
      </ul>

      <h2>Creating a Monitoring Plot</h2>
      <p>
        To create a monitoring plot, users complete a simple registration form. This form captures
        three key aspects:
      </p>

      <h3>1. Plot Type</h3>
      <p>Users select whether the plot is an <strong>Intervention</strong> or a <strong>Control</strong> plot:</p>
      <ul>
        <li>
          <strong>Intervention plots</strong> are areas where restoration activities (such as
          planting or assisted regeneration) have taken place.
        </li>
        <li>
          <strong>Control plots</strong> represent areas without interventions and are used as
          reference points for comparison.
        </li>
      </ul>

      <PlaceholderImage
        title="Plot Type Selection"
        description="Screenshot showing intervention vs control plot selection"
        aspectRatio="portrait"
      />

      <h3>2. Plot Details</h3>
      <p>
        Users define the basic characteristics of the plot, such as its name and dimensions. This
        ensures that the plot can be consistently revisited and monitored over time.
      </p>

      <PlaceholderImage
        title="Plot Details Form"
        description="Screenshot showing plot name and dimensions input"
        aspectRatio="portrait"
      />

      <h3>3. Location</h3>
      <p>
        The plot's geographic location is recorded so that it can be accurately mapped, revisited,
        and visualized within the platform.
      </p>

      <PlaceholderImage
        title="Plot Location Mapping"
        description="Screenshot showing plot location on map"
        aspectRatio="portrait"
      />

      <p>
        Once these steps are completed, the monitoring plot is registered and ready for data
        collection.
      </p>

      <h2>Adding Plants to a Monitoring Plot</h2>
      <p>
        After a plot is created, users can add plant-level data within the plot area.
      </p>

      <p>For each plant, users record:</p>
      <ul>
        <li>Whether the plant was <strong>planted</strong> or is a <strong>recruit</strong> (naturally occurring)</li>
        <li>The <strong>species</strong></li>
        <li><strong>Initial measurements</strong> (such as height or diameter)</li>
        <li><strong>Optional tags</strong> for identification or grouping</li>
        <li>The plant's <strong>position</strong> within the plot</li>
      </ul>

      <p>
        This allows the plot to capture both restoration efforts and natural regeneration in a
        single monitoring framework.
      </p>

      <PlaceholderImage
        title="Adding Plants to Plot"
        description="Screenshot showing plant data entry form"
        aspectRatio="portrait"
      />

      <h2>Plant Timeline and Remeasurements</h2>
      <p>
        Plants within a monitoring plot can be observed repeatedly over time through a plant timeline.
      </p>

      <p>As monitoring continues, users can:</p>
      <ul>
        <li>Add new measurements as plants grow</li>
        <li>Update existing measurements if corrections are needed</li>
        <li>Mark plants as deceased when applicable</li>
      </ul>

      <p>
        This creates a clear historical record of each plant's development and survival, supporting
        long-term analysis of restoration outcomes.
      </p>

      <PlaceholderImage
        title="Plant Timeline"
        description="Screenshot showing plant measurement history and timeline"
        aspectRatio="portrait"
      />

      <h2>Plot Observations</h2>
      <p>
        Monitoring plots also include an observations section for recording broader environmental
        changes within the plot.
      </p>

      <p>Currently supported observations include:</p>
      <ul>
        <li><strong>Soil Moisture</strong></li>
        <li><strong>Canopy Cover</strong></li>
      </ul>

      <p>
        Observations are recorded using a single, structured form and can be edited later if
        corrections are required. Additional observation types, such as bioacoustics, are planned
        for future updates.
      </p>

      <PlaceholderImage
        title="Plot Observations"
        description="Screenshot showing observation recording form"
        aspectRatio="portrait"
      />

      <h2>Map View and Plot Visualization</h2>
      <p>Each monitoring plot includes a dedicated map view that shows:</p>
      <ul>
        <li>The plot boundary</li>
        <li>The location of plants within the plot</li>
      </ul>

      <p>
        From this view, users can navigate to individual plant details and adjust plot dimensions
        when necessary. This spatial overview helps ensure accuracy and clarity during field
        monitoring.
      </p>

      <PlaceholderImage
        title="Plot Map View"
        description="Screenshot showing plot boundary and plant locations on map"
        aspectRatio="portrait"
      />

      <h2>Editing and Updating Plot Data</h2>
      <p>
        All monitoring plot data remains fully editable. Users can update plot details, plant
        records, observations, and locations to ensure data accuracy as monitoring progresses or
        new information becomes available.
      </p>

      <h2>Plot Groups</h2>
      <p>
        Monitoring plots can be organized into groups to simplify analysis and management.
      </p>

      <ul>
        <li>A group can contain multiple monitoring plots</li>
        <li>Each monitoring plot can belong to only one group</li>
      </ul>

      <p>
        Groups are useful for organizing plots that share similar characteristics, objectives, or
        study designs, such as:
      </p>
      <ul>
        <li>Control vs intervention comparisons</li>
        <li>Long-term research areas</li>
        <li>Specific restoration strategies</li>
      </ul>

      <p>
        This structure helps users manage large monitoring efforts and analyze results across
        related plots.
      </p>

      <PlaceholderImage
        title="Plot Groups"
        description="Screenshot showing plot group organization"
        aspectRatio="portrait"
      />

      <h2>What's Next?</h2>
      <p>After setting up your monitoring plot, you can:</p>
      <ul>
        <li>
          <Link href="/docs/mobile/measurements">Learn about taking measurements</Link> for
          scientific data collection
        </li>
        <li>
          <Link href="/docs/tutorials/first-intervention">Create interventions</Link> within your
          monitoring plots
        </li>
        <li>
          <Link href="/docs/web/overview">View plot data on the web dashboard</Link> for
          analysis and reporting
        </li>
      </ul>
    </DocPage>
  );
}
