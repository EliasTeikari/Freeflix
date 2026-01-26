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

    try {
      html = await fetchPage(`${BASE_URL}/movie/watch-movie-${id}`);
    } catch {
      // Try TV show URL
      try {
        html = await fetchPage(`${BASE_URL}/tv/watch-tv-${id}`);
        isMovie = false;
      } catch {
        // Try generic detail page
        html = await fetchPage(`${BASE_URL}/watch-movie-${id}`);
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
  try {
    // Get available servers first
    const serversUrl = `${BASE_URL}/ajax/movie/episodes/${id}`;
    const serversResponse = await fetch(serversUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        Referer: BASE_URL,
      },
    });

    if (!serversResponse.ok) {
      return null;
    }

    const serversHtml = await serversResponse.text();
    const $ = cheerio.load(serversHtml);

    // Find the server ID
    let targetServerId = serverId;
    if (!targetServerId) {
      // Get first available server
      targetServerId = $(".server-item").first().attr("data-id") || "";
    }

    if (!targetServerId) {
      return null;
    }

    // Get the embed link
    const embedUrl = `${BASE_URL}/ajax/sources/${targetServerId}`;
    const embedResponse = await fetch(embedUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        Referer: BASE_URL,
      },
    });

    if (!embedResponse.ok) {
      return null;
    }

    const embedData = await embedResponse.json();
    return embedData.link || null;
  } catch (error) {
    console.error("Embed source error:", error);
    return null;
  }
}
