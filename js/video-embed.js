// ============================================================
// KP ATELIER SITE — Video embed renderer
// Admin can add videos as a direct file OR a pasted link (YouTube/Instagram/TikTok).
// This renders whichever type correctly:
//   - file      -> native <video> muted/loop/autoplay (true seamless loop)
//   - youtube   -> iframe embed with autoplay/mute/loop params (near-seamless loop)
//   - instagram -> Instagram's own embed widget (shows their UI chrome — cannot be
//                  forced into a silent seamless loop, that's an Instagram platform limit)
//   - tiktok    -> TikTok's own embed widget (same platform limitation as Instagram)
// ============================================================

function extractYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Renders the HTML for a single video object (from GET /api/videos) inside a
// glass-framed container. `frameClass` lets callers style hero vs gallery differently.
function renderVideoEmbed(video, frameClass = "hero-video-frame") {
  if (video.video_type === "file") {
    return `
      <div class="${frameClass} glass">
        <video autoplay muted loop playsinline>
          <source src="${escapeHtml(video.video_url)}" type="video/mp4" />
        </video>
        <div class="hero-video-shine"></div>
      </div>
    `;
  }

  if (video.video_type === "youtube") {
    const id = extractYouTubeId(video.video_url);
    if (!id) return renderVideoFallback(video, frameClass);
    return `
      <div class="${frameClass} glass">
        <iframe
          src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1"
          allow="autoplay; encrypted-media"
          frameborder="0"
          loading="lazy"
        ></iframe>
        <div class="hero-video-shine"></div>
      </div>
    `;
  }

  if (video.video_type === "instagram") {
    return `
      <div class="${frameClass} glass embed-widget-frame">
        <blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${escapeHtml(video.video_url)}" style="margin:0; width:100%;"></blockquote>
      </div>
    `;
  }

  if (video.video_type === "tiktok") {
    return `
      <div class="${frameClass} glass embed-widget-frame">
        <blockquote class="tiktok-embed" cite="${escapeHtml(video.video_url)}" style="margin:0; width:100%;">
          <a href="${escapeHtml(video.video_url)}" target="_blank">Watch on TikTok</a>
        </blockquote>
      </div>
    `;
  }

  return renderVideoFallback(video, frameClass);
}

// Fallback: a clean clickable card linking out, used if a link type can't be parsed
function renderVideoFallback(video, frameClass) {
  return `
    <a href="${escapeHtml(video.video_url)}" target="_blank" class="${frameClass} glass video-fallback-card">
      <div class="video-fallback-play">&#9654;</div>
      <div class="video-fallback-label">${escapeHtml(video.title || "Watch video")}</div>
    </a>
  `;
}

// Lazily loads Instagram/TikTok's own embed scripts only when actually needed,
// and re-processes any embed blockquotes already in the DOM.
function loadEmbedScript(type) {
  const scriptId = `embed-script-${type}`;
  if (document.getElementById(scriptId)) {
    // Script already loaded — just ask it to re-scan the page for new embeds
    if (type === "instagram" && window.instgrm) window.instgrm.Embeds.process();
    if (type === "tiktok" && window.tiktokEmbed) window.tiktokEmbed.lib.render();
    return;
  }
  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = type === "instagram" ? "https://www.instagram.com/embed.js" : "https://www.tiktok.com/embed.js";
  document.body.appendChild(script);
}

// Fetches videos for a given placement and renders the first one into a container.
// Call this from any page that has a spot for a video (hero, gallery, etc).
async function loadPlacementVideo(placement, containerEl, frameClass) {
  if (!containerEl) return;
  try {
    const data = await apiRequest(`/videos?placement=${placement}`);
    if (!data.videos || !data.videos.length) return; // nothing to show, leave container empty

    const video = data.videos[0];
    containerEl.innerHTML = renderVideoEmbed(video, frameClass);

    if (video.video_type === "instagram") loadEmbedScript("instagram");
    if (video.video_type === "tiktok") loadEmbedScript("tiktok");
  } catch (err) {
    // Silent — a missing/unreachable video shouldn't break the page
    console.warn("Could not load video:", err.message);
  }
}
