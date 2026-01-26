import { NextResponse } from "next/server";
import { getEmbedSource } from "@/lib/services/myflixer";
import { filterHtml, getAdBlockCss, getAdBlockScript } from "@/lib/services/ad-filter";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stream/route.ts:GET:entry',message:'Stream API called',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const server = searchParams.get("server");
    const embedUrl = searchParams.get("embed");

    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stream/route.ts:GET:params',message:'Stream params',data:{id,server,hasEmbedUrl:!!embedUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion

    // If embed URL is provided, proxy the content
    if (embedUrl) {
      return await proxyEmbed(embedUrl);
    }

    if (!id) {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 }
      );
    }

    // Get the embed source URL
    const sourceUrl = await getEmbedSource(id, server || undefined);

    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stream/route.ts:GET:sourceUrl',message:'getEmbedSource result',data:{id,sourceUrl,hasSourceUrl:!!sourceUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "No stream available" },
        { status: 404 }
      );
    }

    // Return the embed URL for the client to use
    return NextResponse.json({ 
      embedUrl: sourceUrl,
      proxyUrl: `/api/movies/stream?embed=${encodeURIComponent(sourceUrl)}`
    });
  } catch (error) {
    console.error("Stream API error:", error);
    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stream/route.ts:GET:error',message:'Stream API error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch embed: ${response.status}`);
    }

    let html = await response.text();

    // Filter ads from HTML
    html = filterHtml(html);

    // Inject ad blocker CSS and script
    const adBlockCss = `<style>${getAdBlockCss()}</style>`;
    const adBlockScript = `<script>${getAdBlockScript()}</script>`;

    // Insert at the beginning of head
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${adBlockCss}${adBlockScript}`);
    } else if (html.includes("<html>")) {
      html = html.replace("<html>", `<html><head>${adBlockCss}${adBlockScript}</head>`);
    } else {
      html = `${adBlockCss}${adBlockScript}${html}`;
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
