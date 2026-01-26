import { NextResponse } from "next/server";

// Diagnostic endpoint to check if the external source is accessible from Vercel
export async function GET() {
  const BASE_URL = process.env.MYFLIXER_BASE_URL || "https://myflixerz.to";
  const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {
      MYFLIXER_BASE_URL: process.env.MYFLIXER_BASE_URL || "NOT_SET (using default)",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || "NOT_SET",
    },
    tests: {} as Record<string, unknown>,
  };

  // Test 1: Can we reach the base URL?
  try {
    const response = await fetch(BASE_URL, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    diagnostics.tests = {
      ...diagnostics.tests as Record<string, unknown>,
      baseUrl: {
        url: BASE_URL,
        status: response.status,
        ok: response.ok,
        headers: {
          server: response.headers.get("server"),
          contentType: response.headers.get("content-type"),
        },
      },
    };
  } catch (error) {
    diagnostics.tests = {
      ...diagnostics.tests as Record<string, unknown>,
      baseUrl: {
        url: BASE_URL,
        error: String(error),
      },
    };
  }

  // Test 2: Can we fetch the home page (trending)?
  try {
    const homeResponse = await fetch(`${BASE_URL}/home`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    const homeHtml = await homeResponse.text();
    diagnostics.tests = {
      ...diagnostics.tests as Record<string, unknown>,
      homePage: {
        status: homeResponse.status,
        ok: homeResponse.ok,
        htmlLength: homeHtml.length,
        hasMovieItems: homeHtml.includes("flw-item"),
        sampleContent: homeHtml.substring(0, 500),
      },
    };
  } catch (error) {
    diagnostics.tests = {
      ...diagnostics.tests as Record<string, unknown>,
      homePage: {
        error: String(error),
      },
    };
  }

  // Test 3: Test AJAX endpoint for a known movie ID
  const testMovieId = "99999"; // A test ID
  try {
    const ajaxResponse = await fetch(`${BASE_URL}/ajax/movie/episodes/${testMovieId}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        Referer: BASE_URL,
      },
      signal: AbortSignal.timeout(10000),
    });
    const ajaxText = await ajaxResponse.text();
    diagnostics.tests = {
      ...diagnostics.tests as Record<string, unknown>,
      ajaxEndpoint: {
        url: `${BASE_URL}/ajax/movie/episodes/${testMovieId}`,
        status: ajaxResponse.status,
        responseLength: ajaxText.length,
        sample: ajaxText.substring(0, 300),
      },
    };
  } catch (error) {
    diagnostics.tests = {
      ...diagnostics.tests as Record<string, unknown>,
      ajaxEndpoint: {
        error: String(error),
      },
    };
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
}
