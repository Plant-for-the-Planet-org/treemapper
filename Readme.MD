# TreeMapper App
TreeMapper is open source application based on react-native licensed under terms of GPL v3. It is managed by [Plant-for-the-Planet Foundation](https://www.plant-for-the-planet.org/) and open source contributors.
For contributions please read our [contribution guide](https://github.com/Plant-for-the-Planet-org/treemapper/blob/develop/CONTRIBUTING.md) as well as our [code of conduct](https://github.com/Plant-for-the-Planet-org/treemapper/blob/develop/CODE_OF_CONDUCT.md) and the following information:
## TreeMapper on Web
Data uploaded by TreeMapper can be viewed on the [Plant-for-the-Planet Platform](https://pp.eco)
<img width="1289" alt="Screen Shot 2021-08-04 at 4 05 38 PM" src="https://user-images.githubusercontent.com/5401575/128246400-949f9502-0ecd-4e6b-8695-003752b05331.png">
## Directory Structure
The repository is structured by using Expo managed workflow.
## Configuration
Copy `.env.sample` file to `.env` file and add the missing tokens.
## iOS Setup
```bash
npx expo prebuild --platform ios  --clean
```
### Running into iOS simulator or device
```bash
npx expo run:ios --device
```
## Android Setup
```bash
npx expo prebuild --platform android  --clean
```
### Running into Android emulator or device
```bash
npx expo run:android --device
```
## Development process
This project uses GitFlow (https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) with Master-Branch `main` and Development-Branch `develop`.


# TreeMapper App

TreeMapper is open source application based on react-native licensed under terms of GPL v3. It is managed by [Plant-for-the-Planet Foundation](https://www.plant-for-the-planet.org/) and open source contributors.

For contributions please read our [contribution guide](https://github.com/Plant-for-the-Planet-org/treemapper/blob/develop/CONTRIBUTING.md) as well as our [code of conduct](https://github.com/Plant-for-the-Planet-org/treemapper/blob/develop/CODE_OF_CONDUCT.md) and the following information:

## TreeMapper on Web
Data uploaded by TreeMapper can be viewed on the [Plant-for-the-Planet Platform](https://pp.eco)
<img width="1289" alt="Screen Shot 2021-08-04 at 4 05 38 PM" src="https://user-images.githubusercontent.com/5401575/128246400-949f9502-0ecd-4e6b-8695-003752b05331.png">

## Directory Structure

The repository is structured by using Expo managed workflow.

## Configuration

Copy `.env.sample` file to `.env` file and add the missing tokens.

## iOS Setup

```bash
npx expo prebuild --platform ios  --clean
```

### Running into iOS simulator or device

```bash
npx expo run:ios --device
```

## Android Setup

```bash
npx expo prebuild --platform android  --clean
```

### Running into Android emulator or device

```bash
npx expo run:android --device
```

## Development process

This project uses GitFlow (https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) with Master-Branch `main` and Development-Branch `develop`.

App Download Verification
-------------------------

All versions released for TreeMapper are signed with the same release keys. You can verify the authencity of the app by using 
[apksigner](https://developer.android.com/studio/command-line/apksigner.html#options-verify):


Every release includes the APK file, which is also published on the Google Play Store.

## 🔑 APK Verification

To ensure the integrity and authenticity of the APK, you can verify its signature using `apksigner`.

### **How to Verify the APK Signature**
1. Download the APK from the [Releases](https://github.com/Plant-for-the-Planet-org/treemapper/releases) section.
2. Use the following command to verify the certificate fingerprint:

   ```sh
      apksigner verify --print-certs --verbose TreeMapper.apk
   ```

3. Compare the output with the official fingerprints below.

## 🔍 Certificate Fingerprints

These fingerprints belong to the official signing key used by Google Play to sign this app:

- **MD5:** `25:17:26:0A:20:C6:8B:E7:D1:DA:CF:31:4B:77:36:33`
- **SHA-1:** `C6:6D:10:EF:C1:89:26:89:C3:93:81:C3:24:59:DA:08:31:BE:06:A2`
- **SHA-256:** `33:F3:D2:3E:5D:82:AF:5D:4B:26:51:68:94:31:C4:DC:46:AB:7B:19:E3:13:E4:7E:F6:E7:2D:70:D9:D9:CA:6E`

If the output of `apksigner` matches these fingerprints, you can be sure that the APK is authentic and has not been tampered with.
---

## Supporters
The deployment and production of this app is also possible due to support from open-source software contributors.
<a href="https://www.browserstack.com">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTPH0TU07S98aX7O5PbjVtOwLz5Q-8IAnaRWn6tv_qkxKaAedd9" height="24"></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://www.bugsnag.com">
<img src="https://global-uploads.webflow.com/5c741219fd0819540590e785/5c741219fd0819856890e790_asset%2039.svg" height="24"></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://lingohub.com">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQqJ0vVrXzxzszvleoGhXuxpMFlGueY5UfBEP-HPtTVTH2j29hv" height="30"></a>

