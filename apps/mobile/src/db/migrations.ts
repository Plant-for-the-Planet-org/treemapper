
import Realm from "realm";
import Bugsnag from "@bugsnag/expo";
import { RealmSchema } from "src/types/enum/db.enum";

export const runRealmMigrations = ({
  oldRealm,
  newRealm,
}: {
  oldRealm: Realm;
  newRealm: Realm;
}) => {
  try {
    // v24: PlantTimeline.sync_status was added (default NOT_SYNCED). For plots
    // that were already SYNCED, their existing timeline entries went up with the
    // plot, so mark them SYNCED; otherwise the plot would resurface as having
    // pending remeasurements. NOT_SYNCED plots keep the default (their timelines
    // upload with the plot on the next full sync).
    if (oldRealm.schemaVersion < 24) {
      const plots = newRealm.objects(RealmSchema.MonitoringPlot) as any;
      for (const plot of plots) {
        const synced = plot.status === 'SYNCED';
        for (const plant of plot.plot_plants) {
          for (const entry of plant.timeline) {
            entry.sync_status = synced ? 'SYNCED' : 'NOT_SYNCED';
          }
        }
      }
    }
  } catch (error) {
    Bugsnag.notify(error as Error)
  }
};
