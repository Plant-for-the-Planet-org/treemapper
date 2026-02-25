
import { NextResponse } from 'next/server';

const aasaContent = {
  "applinks": {
    "details": [
      {
        "appIDs": [
          "UYRJ8SA699.org.pftp.treemapper"
        ],
        "components": [
          {
            "/": "/dashboard*",
            "comment": "Matches any URL with path that starts with /dashboard"
          },
          {
            "/": "/*",
            "?": {
              "invite": "*"
            },
            "comment": "Matches any URL with invite query parameter"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "UYRJ8SA699.org.pftp.treemapper"
    ]
  },
  "activitycontinuation": {
    "apps": [
      "UYRJ8SA699.org.pftp.treemapper"
    ]
  }
};

export async function GET() {
  return new NextResponse(JSON.stringify(aasaContent), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
