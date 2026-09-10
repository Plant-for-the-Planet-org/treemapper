
import Realm from "realm";
import Bugsnag from "@bugsnag/expo";
import { RealmSchema } from "src/types/enum/db.enum";
import { polygonCenter } from "src/utils/helpers/turfHelpers";

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

    // v27: PlotObservation.sync_status was added (default NOT_SYNCED). Existing
    // observations on a SYNCED plot already went up with the plot upload, so mark
    // them SYNCED; otherwise they would resurface as pending and re-upload as
    // duplicates. Observations on not-yet-synced plots keep NOT_SYNCED.
    if (oldRealm.schemaVersion < 27) {
      const plots = newRealm.objects(RealmSchema.MonitoringPlot) as any;
      for (const plot of plots) {
        const synced = plot.status === 'SYNCED';
        for (const obs of plot.observations) {
          obs.sync_status = synced ? 'SYNCED' : 'NOT_SYNCED';
        }
      }
    }
    // v29: PlotGroups gained project_id / project_name / sync_status. Groups are
    // now created on the server the moment the user makes one, so every new group
    // has a project and a server row. Groups made before this only ever existed
    // on the device: they are marked LOCAL_ONLY, so deleting one skips the server
    // call instead of failing on a group the server never had.
    if (oldRealm.schemaVersion < 29) {
      // MonitoringPlot.fix_required was added in the same version. Every existing
      // plot is assumed fine: only a rejected upload sets it to anything else, and
      // a plot that was already failing gets marked on its next attempt.
      //
      // The same pass repairs the plot centre. It used to be written as a single
      // number instead of a [lng, lat] pair, so the sync dropped it and no plot
      // recorded on a device has one. Recomputing it from the boundary that is
      // already stored means plots waiting to upload carry a centre too, rather
      // than only ones drawn after this version.
      const plots = newRealm.objects(RealmSchema.MonitoringPlot) as any;
      for (const plot of plots) {
        plot.fix_required = 'NO';

        const stored = plot.coords?.coordinates;
        if (Array.isArray(stored) && stored.length >= 2) continue;
        try {
          const rings = plot.location?.coordinates ? JSON.parse(plot.location.coordinates) : null;
          const centre = polygonCenter(rings);
          if (centre) {
            plot.coords = { type: 'Point', coordinates: centre };
          }
        } catch (_) {
          // An unreadable boundary just leaves the plot without a centre, which
          // is what it had before.
        }
      }

      const groups = newRealm.objects(RealmSchema.PlotGroups) as any;
      for (const group of groups) {
        group.sync_status = 'LOCAL_ONLY';
        // Best effort: a group's plots all carry their own project, so borrow
        // the first one. It lets an old group be adopted by the server later
        // instead of being stranded.
        const withProject = [...group.plots].find((p: any) => !!p.project_id);
        group.project_id = withProject?.project_id ?? '';
        group.project_name = withProject?.project_name ?? '';
      }
    }
  } catch (error) {
    Bugsnag.notify(error as Error)
  }
};
