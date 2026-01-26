import { NextResponse } from "next/server";
import { getAllEmbedSources, getEpisodeEmbedSources } from "@/lib/services/myflixer";
import { filterHtml, getAdBlockCss, getAdBlockScript } from "@/lib/services/ad-filter";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// #region agent log
const logDebug = (location: string, message: string, data: Record<string, unknown>, hypothesisId: string) => {
  console.log(`[DEBUG][${hypothesisId}] ${location}: ${message}`, JSON.stringify(data));
};
// #endregion

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const episodeId = searchParams.get("episodeId");
    const embedUrl = searchParams.get("embed");

    // #region agent log
    logDebug('stream/route.ts:GET:entry', 'Stream API called', { id, episodeId, hasEmbedUrl: !!embedUrl, MYFLIXER_BASE_URL: process.env.MYFLIXER_BASE_URL || 'NOT_SET' }, 'A');
    // #endregion

    // If embed URL is provided, proxy the content
    if (embedUrl) {
      return await proxyEmbed(embedUrl);
    }

    if (!id && !episodeId) {
      return NextResponse.json(
        { error: "Movie ID or Episode ID is required" },
        { status: 400 }
      );
    }

    // Get embed sources - use episode-specific function if episodeId is provided
    let allSources: { serverId: string; serverName: string; link: string }[];
    
    // #region agent log
    logDebug('stream/route.ts:GET:before-fetch', 'About to fetch embed sources', { id, episodeId, isEpisode: !!episodeId }, 'B');
    // #endregion

    if (episodeId) {
      // Fetch servers for specific episode
      allSources = await getEpisodeEmbedSources(episodeId);
    } else {
      // Fetch servers for movie (or first episode of series)
      allSources = await getAllEmbedSources(id!);
    }

    // #region agent log
    logDebug('stream/route.ts:GET:after-fetch', 'Embed sources fetched', { sourcesCount: allSources.length, sources: allSources.slice(0, 3).map(s => ({ serverName: s.serverName, linkPrefix: s.link?.substring(0, 50) })) }, 'D');
    // #endregion

    if (allSources.length === 0) {
      // #region agent log
      logDebug('stream/route.ts:GET:no-sources', 'No embed sources found', { id, episodeId }, 'D');
      // #endregion
      return NextResponse.json(
        { error: "No stream available" },
        { status: 404 }
      );
    }

    // Return all embed URLs for client-side fallback
    // #region agent log
    logDebug('stream/route.ts:GET:returning', 'Returning embed URLs', { embedUrl: allSources[0].link, totalUrls: allSources.length }, 'C');
    // #endregion
    return NextResponse.json({ 
      embedUrl: allSources[0].link, // Primary URL for backwards compatibility
      embedUrls: allSources.map(s => ({
        url: s.link,
        serverName: s.serverName,
        serverId: s.serverId,
      })),
      proxyUrl: `/api/movies/stream?embed=${encodeURIComponent(allSources[0].link)}`
    });
  } catch (error) {
    // #region agent log
    logDebug('stream/route.ts:GET:error', 'Stream API error', { error: String(error), stack: error instanceof Error ? error.stack : undefined }, 'B');
    // #endregion
    console.error("Stream API error:", error);
    return NextResponse.json(
      { error: "Failed to get stream" },
      { status: 500 }
    );
  }
}

async function proxyEmbed(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://myflixerz.to/",
        "Origin": "https://myflixerz.to",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch embed: ${response.status}`);
    }

    let html = await response.text();

    // Extract base URL from embed URL to fix relative paths
    const embedOrigin = new URL(url).origin;
    const baseTag = `<base href="${embedOrigin}/">`;

    // Filter ads from HTML
    html = filterHtml(html);

    // Inject ad blocker CSS and script
    const adBlockCss = `<style>${getAdBlockCss()}</style>`;
    const adBlockScript = `<script>${getAdBlockScript()}</script>`;

    // Insert base tag and ad blockers at the beginning of head
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}${adBlockCss}${adBlockScript}`);
    } else if (html.includes("<html>")) {
      html = html.replace("<html>", `<html><head>${baseTag}${adBlockCss}${adBlockScript}</head>`);
    } else {
      html = `${baseTag}${adBlockCss}${adBlockScript}${html}`;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Proxy embed error:", error);
    return NextResponse.json(
      { error: "Failed to proxy embed" },
      { status: 500 }
    );
  }
}
