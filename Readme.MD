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
## Supporters
The deployment and production of this app is also possible due to support from open-source software contributors.
<a href="https://www.browserstack.com">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTPH0TU07S98aX7O5PbjVtOwLz5Q-8IAnaRWn6tv_qkxKaAedd9" height="24"></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://www.bugsnag.com">
<img src="https://global-uploads.webflow.com/5c741219fd0819540590e785/5c741219fd0819856890e790_asset%2039.svg" height="24"></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://lingohub.com">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQqJ0vVrXzxzszvleoGhXuxpMFlGueY5UfBEP-HPtTVTH2j29hv" height="30"></a>

# APK Verification Guide
Since this app is open source, anyone can build an APK from the source code. However, only the official releases are signed with the original signing key. Verifying the APK ensures that you are installing an authentic version of the app.

## How to Verify the APK

### 1. Download the Official APK
Go to the **Releases** section of this GitHub repository and download the latest APK.

### 2. Check the SHA-256 Certificate Fingerprint
You can use the `apksigner` tool (part of the Android SDK) to verify the APK signature.

**Method 1: Using apksigner (Recommended)**
1. Install Android SDK (if not already installed). On macOS, you can install platform tools via Homebrew:

```
brew install --cask android-platform-tools
```

2. Run the following command to check the certificate fingerprint:

```
apksigner verify --print-certs <path-to-apk>.apk
```

3. You will see output like this:

```
Signer #1 certificate SHA-256 digest: ABCD1234... (your fingerprint)
```

4. Compare the SHA-256 fingerprint with the official one below.

### Official SHA-256 Certificate Fingerprint

```
YOUR_OFFICIAL_SHA256_FINGERPRINT_HERE
```

If the fingerprint **matches**, the APK is authentic. If it **does not match**, the APK might have been modified or tampered with.

### 3. Alternative: Using keytool
If you don't have `apksigner`, you can use `keytool`:

```
unzip -p <path-to-apk>.apk META-INF/*.RSA > cert.rsa
keytool -printcert -file cert.rsa
```

Look for the SHA-256 fingerprint and compare it with the official one above.

## Need Help?
If you have any issues verifying the APK, feel free to open an issue in this repository.

## Stay safe and always verify before installing!
