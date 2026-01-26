import * as cheerio from "cheerio";
import type { Movie, MovieDetails, StreamSource, Season, Episode } from "@/types/movie";

const BASE_URL = process.env.MYFLIXER_BASE_URL || "https://myflixerz.to";

// #region agent log
const logDebug = (location: string, message: string, data: Record<string, unknown>, hypothesisId: string) => {
  console.log(`[DEBUG][${hypothesisId}] ${location}: ${message}`, JSON.stringify(data));
};
// #endregion

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
    // Try different URL patterns to fetch the page
    let html: string = '';
    const urlPatterns = [
      `${BASE_URL}/movie/watch-movie-${id}`,
      `${BASE_URL}/tv/watch-tv-${id}`,
      `${BASE_URL}/watch-movie-${id}`,
    ];

    for (const url of urlPatterns) {
      try {
        html = await fetchPage(url);
        break;
      } catch {
        // Continue to next URL pattern
      }
    }

    if (!html) {
      return null;
    }

    const $ = cheerio.load(html);

    // Detect content type from HTML content (not URL)
    // Method 1: Check for season selector elements (TV shows have these)
    const hasSeasons = $(".ss-list").length > 0 || 
                       $("[data-season]").length > 0 ||
                       $(".dropdown-menu.ep-range").length > 0 ||
                       $(".seasons").length > 0;

    // Method 2: Check breadcrumb or URL patterns in the page
    const breadcrumbText = $(".breadcrumb").text().toLowerCase();
    const isTvFromBreadcrumb = breadcrumbText.includes("tv") || 
                               breadcrumbText.includes("series");

    // Method 3: Check the canonical URL or og:url meta tag
    const canonicalUrl = $("link[rel='canonical']").attr("href") || 
                         $("meta[property='og:url']").attr("content") || "";
    const isTvFromUrl = canonicalUrl.includes("/tv/");

    // Method 4: Check page type indicators
    const pageType = $(".dp-i-c-right .type").text().toLowerCase();
    const isTvFromType = pageType.includes("tv");

    // Method 5: Check for episode-related elements
    const hasEpisodes = $(".episodes").length > 0 ||
                        $(".ep-item").length > 0 ||
                        $("[data-episode]").length > 0;

    // Combine signals - if any indicate TV, it's a series
    const isSeries = hasSeasons || isTvFromBreadcrumb || isTvFromUrl || isTvFromType || hasEpisodes;

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
      title: title || `Content ${id}`,
      poster,
      backdrop,
      description: description || "No description available.",
      year: yearMatch?.[1] || "",
      duration: durationMatch ? `${durationMatch[1]} min` : "",
      type: isSeries ? "series" : "movie",
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

// Get ALL embed iframe sources for client-side fallback
export async function getAllEmbedSources(id: string): Promise<{ serverId: string; serverName: string; link: string }[]> {
  // #region agent log
  logDebug('myflixer.ts:getAllEmbedSources:entry', 'Fetching all embed sources', { id, BASE_URL }, 'A');
  // #endregion
  try {
    const possibleUrls = [
      `${BASE_URL}/ajax/movie/episodes/${id}`,
      `${BASE_URL}/ajax/v2/movie/episodes/${id}`,
      `${BASE_URL}/ajax/episode/list/${id}`,
      `${BASE_URL}/ajax/movie/servers/${id}`,
      `${BASE_URL}/ajax/film/servers?id=${id}`,
    ];

    let serversHtml = '';
    let successUrl = '';
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": USER_AGENT, "X-Requested-With": "XMLHttpRequest", Referer: BASE_URL },
        });
        // #region agent log
        logDebug('myflixer.ts:getAllEmbedSources:ajax', 'AJAX response', { url, status: response.status, ok: response.ok }, 'B');
        // #endregion
        
        // Check if response is HTML (blocked by bot protection) instead of JSON
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('text/html')) {
          // Site is returning HTML instead of JSON - likely blocked by Cloudflare/anti-bot
          // #region agent log
          logDebug('myflixer.ts:getAllEmbedSources:blocked', 'Request blocked - received HTML instead of JSON', { url, contentType }, 'B');
          // #endregion
          continue;
        }
        
        if (response.ok) { serversHtml = await response.text(); successUrl = url; break; }
      } catch (e) {
        // #region agent log
        logDebug('myflixer.ts:getAllEmbedSources:ajax-error', 'AJAX fetch failed', { url, error: String(e) }, 'B');
        // #endregion
      }
    }

    if (!serversHtml) {
      // #region agent log
      logDebug('myflixer.ts:getAllEmbedSources:no-html', 'No servers HTML found - source may be blocking automated requests', { id, triedUrls: possibleUrls.length }, 'B');
      // #endregion
      return [];
    }

    const $ = cheerio.load(serversHtml);
    const allServers: { id: string; name: string }[] = [];
    
    $("[data-id]").each((_, el) => {
      const $el = $(el);
      const dataId = $el.attr("data-id");
      const title = $el.attr("title") || $el.text().trim() || 'unknown';
      if (dataId && !allServers.find(s => s.id === dataId)) {
        allServers.push({ id: dataId, name: title });
      }
    });

    // #region agent log
    logDebug('myflixer.ts:getAllEmbedSources:servers-parsed', 'Servers parsed from HTML', { successUrl, serverCount: allServers.length, servers: allServers.slice(0, 5) }, 'D');
    // #endregion

    const embedLinks: { serverId: string; serverName: string; link: string }[] = [];

    for (const server of allServers) {
      const embedEndpoints = [
        `${BASE_URL}/ajax/episode/sources/${server.id}`,
        `${BASE_URL}/ajax/sources/${server.id}`,
      ];

      for (const embedUrl of embedEndpoints) {
        try {
          const embedResponse = await fetch(embedUrl, {
            headers: { "User-Agent": USER_AGENT, "X-Requested-With": "XMLHttpRequest", Referer: BASE_URL },
          });
          if (embedResponse.ok) {
            const embedData = await embedResponse.json();
            if (embedData.link) {
              embedLinks.push({ serverId: server.id, serverName: server.name, link: embedData.link });
              // #region agent log
              logDebug('myflixer.ts:getAllEmbedSources:embed-found', 'Embed link found', { serverId: server.id, serverName: server.name, linkPrefix: embedData.link.substring(0, 60) }, 'C');
              // #endregion
              break;
            }
          }
        } catch { /* continue */ }
      }
    }

    // #region agent log
    logDebug('myflixer.ts:getAllEmbedSources:complete', 'All embed sources fetched', { totalLinks: embedLinks.length }, 'D');
    // #endregion

    return embedLinks;
  } catch (error) {
    // #region agent log
    logDebug('myflixer.ts:getAllEmbedSources:error', 'Error fetching embed sources', { error: String(error) }, 'B');
    // #endregion
    console.error("getAllEmbedSources error:", error);
    return [];
  }
}

// Get embed iframe source (single - legacy)
export async function getEmbedSource(id: string, serverId?: string): Promise<string | null> {
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
    
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            Referer: BASE_URL,
          },
        });
        if (response.ok) {
          serversHtml = await response.text();
          break;
        }
      } catch {
        // Continue to next URL
      }
    }

    if (!serversHtml) {
      return null;
    }

    const $ = cheerio.load(serversHtml);

    // Collect ALL available server IDs with their names
    const allServers: { id: string; name: string; type: string }[] = [];
    
    // If a specific serverId was requested, try it first
    if (serverId) {
      allServers.push({ id: serverId, name: 'requested', type: 'requested' });
    }
    
    // Collect all server IDs from various selectors - expanded to catch more patterns
    $("[data-id]").each((_, el) => {
      const $el = $(el);
      const dataId = $el.attr("data-id");
      const title = $el.attr("title") || '';
      const text = $el.text().trim();
      const className = $el.attr("class") || '';
      
      if (dataId && !allServers.find(s => s.id === dataId)) {
        allServers.push({ 
          id: dataId, 
          name: title || text || 'unknown',
          type: className.includes('link-item') ? 'link-item' : className.includes('server') ? 'server' : 'other'
        });
      }
    });
    
    const allServerIds = allServers.map(s => s.id);

    if (allServerIds.length === 0) {
      return null;
    }

    // Collect all embed links from all servers first, then validate them
    const embedLinks: { serverId: string; link: string }[] = [];

    // Try each server to collect embed links
    for (const targetServerId of allServerIds) {
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
              embedLinks.push({ serverId: targetServerId, link: embedData.link });
              break; // Found link for this server, move to next server
            }
          }
        } catch {
          // Continue to next endpoint
        }
      }
    }

    // Validate each embed link - but also keep track for fallback
    let firstLink = embedLinks.length > 0 ? embedLinks[0].link : null;
    
    // Now validate each embed link by checking if it returns valid content
    for (const { link } of embedLinks) {
      try {
        const validateResponse = await fetch(link, {
          method: 'GET',
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            Referer: BASE_URL,
            Origin: new URL(link).origin,
          },
        });

        const htmlContent = await validateResponse.text();
        
        // Check for common error indicators in the embed page
        const isError = htmlContent.includes("We're Sorry") || 
                       htmlContent.includes("file you are looking for") ||
                       htmlContent.includes("deleted by the owner") ||
                       htmlContent.includes("copyright violation") ||
                       htmlContent.includes("Video not found") ||
                       htmlContent.includes("File not found") ||
                       (htmlContent.includes("404") && htmlContent.length < 5000);

        // Check for signs of a working player (video tags, player scripts, etc.)
        const hasVideoPlayer = htmlContent.includes('<video') || 
                              htmlContent.includes('player') ||
                              htmlContent.includes('jwplayer') ||
                              htmlContent.includes('plyr') ||
                              htmlContent.includes('hls.js') ||
                              htmlContent.includes('.m3u8');

        if (validateResponse.ok && !isError && (hasVideoPlayer || htmlContent.length > 5000)) {
          return link;
        }
      } catch {
        // Continue to next link
      }
    }
    
    // Return first link as fallback - let the browser/user decide
    return firstLink;
  } catch (error) {
    console.error("Embed source error:", error);
    return null;
  }
}

// Get seasons for a TV series
export async function getSeriesSeasons(id: string): Promise<Season[]> {
  try {
    const possibleUrls = [
      `${BASE_URL}/ajax/v2/tv/seasons/${id}`,
      `${BASE_URL}/ajax/tv/seasons/${id}`,
      `${BASE_URL}/ajax/season/list/${id}`,
    ];

    let seasonsHtml = '';
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            Referer: BASE_URL,
          },
        });
        if (response.ok) {
          seasonsHtml = await response.text();
          break;
        }
      } catch {
        // Continue to next URL
      }
    }

    if (!seasonsHtml) {
      return [];
    }

    const $ = cheerio.load(seasonsHtml);
    const seasons: Season[] = [];

    // Parse season items - they typically have data-id attribute
    $("[data-id]").each((index, el) => {
      const $el = $(el);
      const seasonId = $el.attr("data-id");
      const seasonText = $el.text().trim();
      
      // Extract season number from text like "Season 1" or "S1"
      const seasonMatch = seasonText.match(/(?:Season\s*)?(\d+)/i);
      const seasonNumber = seasonMatch ? parseInt(seasonMatch[1], 10) : index + 1;

      if (seasonId) {
        seasons.push({
          id: seasonId,
          seasonNumber,
          name: seasonText || `Season ${seasonNumber}`,
        });
      }
    });

    // Sort by season number
    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

    return seasons;
  } catch (error) {
    console.error("Get series seasons error:", error);
    return [];
  }
}

// Get episodes for a specific season
export async function getSeasonEpisodes(seasonId: string): Promise<Episode[]> {
  try {
    const possibleUrls = [
      `${BASE_URL}/ajax/v2/season/episodes/${seasonId}`,
      `${BASE_URL}/ajax/season/episodes/${seasonId}`,
      `${BASE_URL}/ajax/episode/list/${seasonId}`,
    ];

    let episodesHtml = '';
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            Referer: BASE_URL,
          },
        });
        if (response.ok) {
          episodesHtml = await response.text();
          break;
        }
      } catch {
        // Continue to next URL
      }
    }

    if (!episodesHtml) {
      return [];
    }

    const $ = cheerio.load(episodesHtml);
    const episodes: Episode[] = [];

    // Parse episode items
    $("[data-id]").each((index, el) => {
      const $el = $(el);
      const episodeId = $el.attr("data-id");
      const episodeTitle = $el.attr("title") || $el.text().trim();
      
      // Extract episode number from text like "Episode 1", "Eps 1", "E1", or just the title
      const episodeMatch = episodeTitle.match(/(?:Episode|Eps?|E)\s*(\d+)/i);
      const episodeNumber = episodeMatch ? parseInt(episodeMatch[1], 10) : index + 1;

      if (episodeId) {
        episodes.push({
          id: episodeId,
          episodeNumber,
          title: episodeTitle || `Episode ${episodeNumber}`,
          seasonId,
        });
      }
    });

    // Sort by episode number
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

    return episodes;
  } catch (error) {
    console.error("Get season episodes error:", error);
    return [];
  }
}

// Get embed sources for a specific episode
export async function getEpisodeEmbedSources(episodeId: string): Promise<{ serverId: string; serverName: string; link: string }[]> {
  try {
    // First, get the servers for this episode
    const possibleUrls = [
      `${BASE_URL}/ajax/v2/episode/servers/${episodeId}`,
      `${BASE_URL}/ajax/episode/servers/${episodeId}`,
    ];

    let serversHtml = '';
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            Referer: BASE_URL,
          },
        });
        if (response.ok) {
          serversHtml = await response.text();
          break;
        }
      } catch {
        // Continue to next URL
      }
    }

    if (!serversHtml) {
      return [];
    }

    const $ = cheerio.load(serversHtml);
    const allServers: { id: string; name: string }[] = [];

    $("[data-id]").each((_, el) => {
      const $el = $(el);
      const dataId = $el.attr("data-id");
      const title = $el.attr("title") || $el.text().trim() || 'unknown';
      if (dataId && !allServers.find(s => s.id === dataId)) {
        allServers.push({ id: dataId, name: title });
      }
    });

    const embedLinks: { serverId: string; serverName: string; link: string }[] = [];

    for (const server of allServers) {
      const embedEndpoints = [
        `${BASE_URL}/ajax/episode/sources/${server.id}`,
        `${BASE_URL}/ajax/sources/${server.id}`,
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
              embedLinks.push({ serverId: server.id, serverName: server.name, link: embedData.link });
              break;
            }
          }
        } catch {
          // Continue
        }
      }
    }

    return embedLinks;
  } catch (error) {
    console.error("Get episode embed sources error:", error);
    return [];
  }
}
