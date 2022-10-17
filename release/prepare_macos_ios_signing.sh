#!/bin/sh

echo "Preparing iOS build"

# Decrypt the files
# --batch to prevent interactive command --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/AppStoreCertificates.p12 release/AppStoreCertificates.p12.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/0a295d53-a21d-4c2d-bea4-fe5ca6f36dbe.mobileprovision release/0a295d53-a21d-4c2d-bea4-fe5ca6f36dbe.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/84bc6e56-62bb-4785-b50c-55d4681f27b2.mobileprovision release/84bc6e56-62bb-4785-b50c-55d4681f27b2.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/99be43a1-fdc5-43e9-93b4-1898d8d4a296.mobileprovision release/99be43a1-fdc5-43e9-93b4-1898d8d4a296.mobileprovision.gpg

echo "Release folder:"
ls -l release/*

# Install the provisioning profiles
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
echo "List profiles"
ls ~/Library/MobileDevice/Provisioning\ Profiles/
echo "Move profiles"
cp release/*.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/
echo "List profiles"
ls ~/Library/MobileDevice/Provisioning\ Profiles/

security create-keychain -p "" build.keychain
security import release/AppStoreCertificates.p12 -t agg -k ~/Library/Keychains/build.keychain -P "$PROVISIONING_PASSWORD" -A
security list-keychains -s ~/Library/Keychains/build.keychain
security default-keychain -s ~/Library/Keychains/build.keychain
security unlock-keychain -p "" ~/Library/Keychains/build.keychain
security set-key-partition-list -S apple-tool:,apple: -s -k "" ~/Library/Keychains/build.keychain
security set-keychain-settings ~/Library/Keychains/build.keychain
security show-keychain-info ~/Library/Keychains/build.keychain
