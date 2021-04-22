echo 'removing npm, metro and react cache'
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
watchman watch-del-all
npm cache verify

echo 'removing node modules'
rm -rf node_modules
rm -rf package-lock.json
​
# DO THIS IF YOU REALLY NEED
# echo 'cocoapods install'
# gem install cocoapods
​
# DO THIS IF YOU REALLY NEED
# echo 'brew'
# brew update && brew upgrade
​
echo 'installing node modules'
# watch out 13.3.0 of node does not work, use 12.13.1 LTS!
npm i

echo 'cleaning Android build'
cd android
./gradlew cleanBuildCache
cd ..


# for Android the minSDK level of the Manifest of react-native-i18n has to be removed​
echo 'now run: npm run android'
