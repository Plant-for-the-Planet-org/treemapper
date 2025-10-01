

import { NextResponse } from 'next/server';

// Apple App Site Association file content
const aasaContent = {
  "applinks": {
    "details": [
      {
        "appIDs": [
          "UYRJ8SA699.org.pftp.treemapper" // Replace TEAMID with your Apple Developer Team ID
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
      "UYRJ8SA699.org.pftp.treemapper" // Replace TEAMID with your Apple Developer Team ID
    ]
  },
  "activitycontinuation": {
    "apps": [
      "UYRJ8SA699.org.pftp.treemapper" // Replace TEAMID with your Apple Developer Team ID
    ]
  }
};

export async function GET() {
  return new NextResponse(JSON.stringify(aasaContent), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}