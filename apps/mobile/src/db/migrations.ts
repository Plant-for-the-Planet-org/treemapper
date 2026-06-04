
import Realm from "realm";
import Bugsnag from "@bugsnag/expo";

export const runRealmMigrations = ({
  oldRealm,
  newRealm,
}: {
  oldRealm: Realm;
  newRealm: Realm;
}) => {
  try {
  } catch (error) {
    Bugsnag.notify(error)
  }
};
