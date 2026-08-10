import { NextResponse } from 'next/server';

// Android Digital Asset Links content
const assetLinksContent = [
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.pftp.treemapper",
      "sha256_cert_fingerprints": [
        // Add your release keystore SHA256 fingerprint here
        "SHA256_FINGERPRINT_RELEASE",
        // Add your debug keystore SHA256 fingerprint here (for testing)
        "SHA256_FINGERPRINT_DEBUG"
      ]
    }
  }
];

export async function GET() {
  return new NextResponse(JSON.stringify(assetLinksContent), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}