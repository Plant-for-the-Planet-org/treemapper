import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function PlotsPage() {
  return (
    <DocPage
      title="Plots & Plot Groups"
      description="Understand monitoring plots and plot groups, key concepts for systematic long-term forest monitoring in TreeMapper."
      pageId="plots"
    >
      <h2>What Are Monitoring Plots?</h2>
      <p>
        A <strong>monitoring plot</strong> is a specific, clearly defined area within a restoration
        site that is observed repeatedly over time. Monitoring plots provide a structured framework
        for collecting consistent, comparable data about forest restoration progress.
      </p>

      <p>
        By repeatedly collecting data from the same defined area, you can track changes in
        vegetation growth, species composition, and ecosystem recovery over time. This systematic
        approach enables evidence-based assessment of restoration effectiveness.
      </p>

      <PlaceholderImage
        title="Monitoring Plot Concept"
        description="Visual representation of a monitoring plot as a defined area for repeated observation"
      />

      <h2>Why Use Monitoring Plots?</h2>
      <p>Monitoring plots are essential for:</p>
      <ul>
        <li>
          <strong>Measuring Effectiveness</strong>: Quantify how well restoration interventions are
          working by comparing data over time
        </li>
        <li>
          <strong>Scientific Rigor</strong>: Provide standardized, repeatable data collection
          methods that meet scientific standards
        </li>
        <li>
          <strong>Comparative Analysis</strong>: Compare restored areas with control areas (areas
          without interventions) to understand restoration impact
        </li>
        <li>
          <strong>Long-Term Tracking</strong>: Establish baseline data and track changes over
          months, years, or decades
        </li>
        <li>
          <strong>Evidence-Based Decisions</strong>: Make informed decisions about restoration
          strategies based on actual data rather than assumptions
        </li>
      </ul>

      <h2>Plot Types</h2>
      <p>TreeMapper supports two main types of monitoring plots:</p>

      <h3>Intervention Plots</h3>
      <p>
        <strong>Intervention plots</strong> are areas where restoration activities have taken place,
        such as:
      </p>
      <ul>
        <li>Tree planting activities</li>
        <li>Assisted regeneration efforts</li>
        <li>Active restoration interventions</li>
      </ul>
      <p>
        These plots help you measure the direct impact of your restoration work by tracking how
        planted trees and restored areas develop over time.
      </p>

      <h3>Control Plots</h3>
      <p>
        <strong>Control plots</strong> represent areas without active interventions. They serve as
        reference points for comparison, helping you understand:
      </p>
      <ul>
        <li>Natural regeneration rates</li>
        <li>Baseline ecosystem conditions</li>
        <li>The difference restoration makes compared to untouched areas</li>
      </ul>
      <p>
        By comparing intervention plots with control plots, you can quantify the actual impact of
        your restoration efforts.
      </p>

      <PlaceholderImage
        title="Intervention vs Control Plots"
        description="Visual comparison showing intervention and control plot concepts"
      />

      <h2>Plot Components</h2>
      <p>Each monitoring plot contains several key components:</p>

      <h3>Plot Definition</h3>
      <ul>
        <li><strong>Name</strong>: Unique identifier for the plot</li>
        <li><strong>Dimensions</strong>: Size and shape of the plot area</li>
        <li><strong>Location</strong>: Geographic coordinates and boundaries</li>
        <li><strong>Type</strong>: Intervention or Control</li>
      </ul>

      <h3>Plant-Level Data</h3>
      <p>
        Within each plot, you can record individual plant data, including:
      </p>
      <ul>
        <li>Whether plants were <strong>planted</strong> or are <strong>recruits</strong> (naturally occurring)</li>
        <li><strong>Species identification</strong></li>
        <li><strong>Measurements</strong>: Height, diameter, and other scientific data</li>
        <li><strong>Position</strong> within the plot</li>
        <li><strong>Tags</strong> for identification or grouping</li>
      </ul>

      <h3>Observations</h3>
      <p>
        Plot-level environmental observations, such as:
      </p>
      <ul>
        <li><strong>Soil Moisture</strong></li>
        <li><strong>Canopy Cover</strong></li>
        <li>Additional observation types (coming soon)</li>
      </ul>

      <PlaceholderImage
        title="Plot Components"
        description="Diagram showing plot structure with plants, measurements, and observations"
      />

      <h2>Plant Timeline and Remeasurements</h2>
      <p>
        One of the most powerful features of monitoring plots is the ability to track individual
        plants over time through a <strong>plant timeline</strong>. This allows you to:
      </p>
      <ul>
        <li>Record multiple measurements as plants grow</li>
        <li>Update measurements if corrections are needed</li>
        <li>Track survival rates by marking plants as deceased</li>
        <li>Create a complete historical record of each plant's development</li>
      </ul>

      <p>
        This longitudinal data collection supports robust analysis of restoration outcomes and helps
        identify which species and strategies are most successful.
      </p>

      <h2>Plot Groups</h2>
      <p>
        <strong>Plot groups</strong> allow you to organize multiple monitoring plots together for
        easier management and analysis.
      </p>

      <h3>Group Structure</h3>
      <ul>
        <li>A group can contain <strong>multiple monitoring plots</strong></li>
        <li>Each monitoring plot can belong to <strong>only one group</strong></li>
        <li>Groups help organize plots with shared characteristics or objectives</li>
      </ul>

      <h3>When to Use Plot Groups</h3>
      <p>Plot groups are particularly useful for:</p>
      <ul>
        <li>
          <strong>Control vs Intervention Comparisons</strong>: Group all control plots together and
          all intervention plots together for easy comparison
        </li>
        <li>
          <strong>Long-Term Research Areas</strong>: Organize plots by research site or study area
        </li>
        <li>
          <strong>Specific Restoration Strategies</strong>: Group plots that use the same
          restoration approach or technique
        </li>
        <li>
          <strong>Geographic Organization</strong>: Group plots by location, watershed, or
          ecological zone
        </li>
        <li>
          <strong>Time-Based Studies</strong>: Organize plots by planting year or monitoring period
        </li>
      </ul>

      <PlaceholderImage
        title="Plot Groups Organization"
        description="Visual representation of how multiple plots can be organized into groups"
      />

      <h2>Benefits of Plot Groups</h2>
      <p>Using plot groups provides several advantages:</p>
      <ul>
        <li>
          <strong>Simplified Management</strong>: Easier to navigate and manage large numbers of
          plots
        </li>
        <li>
          <strong>Bulk Analysis</strong>: Analyze results across related plots simultaneously
        </li>
        <li>
          <strong>Organized Reporting</strong>: Generate reports for specific groups of plots
        </li>
        <li>
          <strong>Clear Structure</strong>: Maintain logical organization as your monitoring
          program grows
        </li>
      </ul>

      <h2>Plots vs Interventions</h2>
      <p>
        It's important to understand the difference between <strong>monitoring plots</strong> and{' '}
        <Link href="/docs/concepts/interventions">interventions</Link>:
      </p>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Key Differences</h4>
        <ul className="mb-0">
          <li>
            <strong>Interventions</strong> document specific actions or events (planting, removal,
            maintenance) at a point in time
          </li>
          <li>
            <strong>Monitoring Plots</strong> are long-term observation areas where you repeatedly
            collect data over time
          </li>
          <li>
            Interventions can be created <em>within</em> monitoring plots to document what was done
          </li>
          <li>
            Monitoring plots provide the framework for tracking the <em>results</em> of interventions
          </li>
        </ul>
      </div>

      <h2>Best Practices</h2>
      <p>When working with monitoring plots:</p>
      <ul>
        <li>
          <strong>Establish Clear Boundaries</strong>: Use GPS and physical markers to ensure plots
          can be accurately relocated
        </li>
        <li>
          <strong>Consistent Methodology</strong>: Use the same measurement protocols and timing
          for all plots in a group
        </li>
        <li>
          <strong>Regular Monitoring</strong>: Schedule regular remeasurement visits to track
          changes over time
        </li>
        <li>
          <strong>Document Everything</strong>: Record environmental conditions, weather, and any
          unusual events during monitoring
        </li>
        <li>
          <strong>Use Plot Groups</strong>: Organize plots logically from the start to make
          management easier as your program grows
        </li>
      </ul>

      <h2>What's Next?</h2>
      <p>Now that you understand plots and plot groups, explore these guides:</p>
      <ul>
        <li>
          <Link href="/docs/tutorials/monitoring-plots">Set up your first monitoring plot</Link> -
          step-by-step tutorial
        </li>
        <li>
          <Link href="/docs/concepts/interventions">Learn about interventions</Link> and how they
          relate to plots
        </li>
        <li>
          <Link href="/docs/mobile/measurements">Learn about taking measurements</Link> for
          scientific data collection
        </li>
        <li>
          <Link href="/docs/web/overview">View plot data on the web dashboard</Link> for analysis
          and reporting
        </li>
      </ul>
    </DocPage>
  );
}
