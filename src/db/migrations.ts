
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
    console.log("old Realm",oldRealm);
    console.log("new Realm",newRealm);
  } catch (error) {
    Bugsnag.notify(error)
  }
};
