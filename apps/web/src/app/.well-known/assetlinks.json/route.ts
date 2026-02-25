import { NextResponse } from 'next/server';

const assetLinksContent = [
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.pftp.treemapper",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_RELEASE",
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
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
