
import Realm from "realm";

export const runRealmMigrations = ({
  oldRealm,
  newRealm,
}: {
  oldRealm: Realm;
  newRealm: Realm;
}) => {
  console.log("old Realm",oldRealm);
  console.log("new Realm",newRealm);

};
