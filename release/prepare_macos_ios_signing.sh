#!/bin/sh

echo "Preparing iOS build"

# Decrypt the files
# --batch to prevent interactive command --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/AppStoreCertificates.p12 release/AppStoreCertificates.p12.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/7fbeadc4-4211-4484-b170-57dd9d639bba.mobileprovision release/7fbeadc4-4211-4484-b170-57dd9d639bba.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/f5c7fa98-7061-4eb1-9c00-3d3077aacd62.mobileprovision release/f5c7fa98-7061-4eb1-9c00-3d3077aacd62.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$PROVISIONING_PASSWORD" --output release/0e9d8b6d-1ca6-429f-be37-7e1d4b4dd5ff.mobileprovision release/0e9d8b6d-1ca6-429f-be37-7e1d4b4dd5ff.mobileprovision.gpg

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
