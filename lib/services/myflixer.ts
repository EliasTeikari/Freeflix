import * as cheerio from "cheerio";
import type { Movie, MovieDetails, StreamSource } from "@/types/movie";

const BASE_URL = process.env.MYFLIXER_BASE_URL || "https://myflixerz.to";

// User agent to mimic a real browser
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: BASE_URL,
    },
    next: { revalidate: 900 }, // Cache for 15 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.text();
}

export async function searchMovies(query: string): Promise<Movie[]> {
  try {
    const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query.replace(/\s+/g, "-"))}`;
    const html = await fetchPage(searchUrl);
    const $ = cheerio.load(html);

    const movies: Movie[] = [];

    $(".flw-item").each((_, element) => {
      const $el = $(element);
      const $link = $el.find(".film-poster-ahref");
      const $poster = $el.find(".film-poster-img");
      const $title = $el.find(".film-name a");
      const $year = $el.find(".fdi-item:first-child");
      const $type = $el.find(".fdi-type");

      const href = $link.attr("href") || "";
      const id = href.split("/").pop()?.split("-").pop() || "";

      if (id) {
        movies.push({
          id,
          title: $title.text().trim(),
          poster: $poster.attr("data-src") || $poster.attr("src") || "",
          year: $year.text().trim(),
          type: $type.text().toLowerCase().includes("tv") ? "series" : "movie",
          rating: $el.find(".film-rating").text().trim() || undefined,
        });
      }
    });

    return movies;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function getTrending(): Promise<Movie[]> {
  try {
    const html = await fetchPage(`${BASE_URL}/home`);
    const $ = cheerio.load(html);

    const movies: Movie[] = [];

    $(".flw-item")
      .slice(0, 20)
      .each((_, element) => {
        const $el = $(element);
        const $link = $el.find(".film-poster-ahref");
        const $poster = $el.find(".film-poster-img");
        const $title = $el.find(".film-name a");
        const $year = $el.find(".fdi-item:first-child");
        const $type = $el.find(".fdi-type");

        const href = $link.attr("href") || "";
        const id = href.split("/").pop()?.split("-").pop() || "";

        if (id) {
          movies.push({
            id,
            title: $title.text().trim(),
            poster: $poster.attr("data-src") || $poster.attr("src") || "",
            year: $year.text().trim(),
            type: $type.text().toLowerCase().includes("tv") ? "series" : "movie",
            rating: $el.find(".film-rating").text().trim() || undefined,
          });
        }
      });

    return movies;
  } catch (error) {
    console.error("Trending error:", error);
    return [];
  }
}

export async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  try {
    // First, try movie URL
    let html: string;
    let isMovie = true;
    let actualUrl = `${BASE_URL}/movie/watch-movie-${id}`;

    try {
      html = await fetchPage(actualUrl);
    } catch {
      // Try TV show URL
      try {
        actualUrl = `${BASE_URL}/tv/watch-tv-${id}`;
        html = await fetchPage(actualUrl);
        isMovie = false;
      } catch {
        // Try generic detail page
        actualUrl = `${BASE_URL}/watch-movie-${id}`;
        html = await fetchPage(actualUrl);
      }
    }

    const $ = cheerio.load(html);

    const title = $(".heading-name").text().trim() || $("h2.heading-name").text().trim();
    const poster = $(".film-poster-img").attr("src") || "";
    const backdrop = $(".watch_block").css("background-image")?.replace(/url\(['"]?|['"]?\)/g, "") || "";
    const description = $(".description").text().trim();
    
    // Parse info items
    const infoText = $(".elements").text();
    const yearMatch = infoText.match(/(\d{4})/);
    const durationMatch = infoText.match(/(\d+)\s*min/i);
    
    const genres: string[] = [];
    $(".row-line:contains('Genre') a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    const cast: string[] = [];
    $(".row-line:contains('Casts') a").each((_, el) => {
      cast.push($(el).text().trim());
    });

    // Get stream sources
    const streams: StreamSource[] = [];
    $(".server-item").each((_, el) => {
      const $server = $(el);
      const serverId = $server.attr("data-id") || "";
      const serverName = $server.text().trim();

      if (serverId) {
        streams.push({
          server: serverName || `Server ${streams.length + 1}`,
          quality: "HD",
          url: `/api/movies/stream?id=${id}&server=${serverId}`,
        });
      }
    });

    // If no servers found, add a placeholder
    if (streams.length === 0) {
      streams.push({
        server: "VidCloud",
        quality: "HD",
        url: `/api/movies/stream?id=${id}&server=default`,
      });
    }

    return {
      id,
      title: title || `Movie ${id}`,
      poster,
      backdrop,
      description: description || "No description available.",
      year: yearMatch?.[1] || "",
      duration: durationMatch ? `${durationMatch[1]} min` : "",
      type: isMovie ? "movie" : "series",
      rating: $(".imdb").text().trim() || undefined,
      genres,
      cast: cast.slice(0, 5),
      streams,
    };
  } catch (error) {
    console.error("Movie details error:", error);
    return null;
  }
}

export async function getStreamUrl(id: string, serverId: string): Promise<string | null> {
  try {
    // Fetch the embed URL
    const ajaxUrl = `${BASE_URL}/ajax/episode/sources/${serverId}`;
    const response = await fetch(ajaxUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        Referer: BASE_URL,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.link) {
      return data.link;
    }

    return null;
  } catch (error) {
    console.error("Stream URL error:", error);
    return null;
  }
}

// Get embed iframe source
export async function getEmbedSource(id: string, serverId?: string): Promise<string | null> {
  // #region agent log
  fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:entry',message:'getEmbedSource called',data:{id,serverId,BASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  try {
    // Try multiple potential AJAX endpoint patterns
    const possibleUrls = [
      `${BASE_URL}/ajax/movie/episodes/${id}`,
      `${BASE_URL}/ajax/v2/movie/episodes/${id}`,
      `${BASE_URL}/ajax/episode/list/${id}`,
      `${BASE_URL}/ajax/movie/servers/${id}`,
      `${BASE_URL}/ajax/film/servers?id=${id}`,
    ];

    let serversHtml = '';
    let successfulUrl = '';
    
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            Referer: BASE_URL,
          },
        });
        // #region agent log
        fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:ajax',message:'AJAX attempt',data:{url,status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        if (response.ok) {
          serversHtml = await response.text();
          successfulUrl = url;
          break;
        }
      } catch {
        // Continue to next URL
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:serversHtml',message:'Servers HTML result',data:{hasHtml:!!serversHtml,htmlLength:serversHtml.length,htmlPreview:serversHtml.slice(0,500),successfulUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (!serversHtml) {
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:noHtml',message:'No servers HTML found - returning null',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return null;
    }

    const $ = cheerio.load(serversHtml);

    // Collect ALL available server IDs
    const allServerIds: string[] = [];
    
    // If a specific serverId was requested, try it first
    if (serverId) {
      allServerIds.push(serverId);
    }
    
    // Collect all server IDs from various selectors
    $(".link-item[data-id], a[data-id], .server-item[data-id]").each((_, el) => {
      const dataId = $(el).attr("data-id");
      if (dataId && !allServerIds.includes(dataId)) {
        allServerIds.push(dataId);
      }
    });

    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:allServers',message:'All server IDs collected',data:{allServerIds,count:allServerIds.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion

    if (allServerIds.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:noServerId',message:'No server ID found - returning null',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return null;
    }

    // Try each server until we find one with an embed link
    for (const targetServerId of allServerIds) {
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:tryingServer',message:'Trying server',data:{targetServerId,serverIndex:allServerIds.indexOf(targetServerId)+1,totalServers:allServerIds.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
      // #endregion

      // Get the embed link - try multiple endpoint patterns
      const embedEndpoints = [
        `${BASE_URL}/ajax/episode/sources/${targetServerId}`,
        `${BASE_URL}/ajax/sources/${targetServerId}`,
        `${BASE_URL}/ajax/server/${targetServerId}`,
        `${BASE_URL}/ajax/embed/${targetServerId}`,
        `${BASE_URL}/ajax/get_link/${targetServerId}`,
      ];

      for (const embedUrl of embedEndpoints) {
        try {
          const embedResponse = await fetch(embedUrl, {
            headers: {
              "User-Agent": USER_AGENT,
              "X-Requested-With": "XMLHttpRequest",
              Referer: BASE_URL,
            },
          });

          if (embedResponse.ok) {
            const embedData = await embedResponse.json();
            
            if (embedData.link) {
              // #region agent log
              fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:success',message:'Found embed link',data:{targetServerId,link:embedData.link},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
              // #endregion
              // Return the first working embed link - browser will load it in iframe
              return embedData.link;
            }
          }
        } catch {
          // Continue to next endpoint
        }
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:noEmbed',message:'No embed link found after trying all servers',data:{id,serversTriedCount:allServerIds.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
    return null;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'myflixer.ts:getEmbedSource:error',message:'Exception caught',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    console.error("Embed source error:", error);
    return null;
  }
}
