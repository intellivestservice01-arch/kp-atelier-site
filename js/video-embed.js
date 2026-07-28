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

// ============================================================
// Video carousel — cycles through every active video for a placement.
// - "file" videos advance automatically when they actually finish playing
//   (listens for the real 'ended' event, so it's exact).
// - youtube/instagram/tiktok embeds don't give us a reliable "finished"
//   signal without much heavier SDK integration, so those advance after a
//   fixed dwell time instead (still feels like a carousel, just time-based).
// Loops back to the first video after the last one.
// ============================================================

const VideoCarousel = {
  EMBED_DWELL_MS: 15000, // how long to show a youtube/instagram/tiktok slide before advancing

  async start(placement, containerEl, frameClass) {
    if (!containerEl) return;
    let videos = [];
    try {
      const data = await apiRequest(`/videos?placement=${placement}`);
      videos = data.videos || [];
    } catch (err) {
      console.warn("Could not load videos:", err.message);
      return;
    }
    if (!videos.length) return; // nothing to show, leave whatever default markup is already there

    let index = 0;
    let advanceTimer = null;

    const showCurrent = () => {
      clearTimeout(advanceTimer);
      const video = videos[index];

      containerEl.classList.add("video-fading");
      setTimeout(() => {
        containerEl.innerHTML = renderVideoEmbed(video, frameClass);
        containerEl.classList.remove("video-fading");

        if (video.video_type === "instagram") loadEmbedScript("instagram");
        if (video.video_type === "tiktok") loadEmbedScript("tiktok");

        if (video.video_type === "file") {
          const videoEl = containerEl.querySelector("video");
          if (videoEl) {
            videoEl.addEventListener("ended", advance, { once: true });
          } else {
            // safety net in case the element didn't mount for some reason
            advanceTimer = setTimeout(advance, this.EMBED_DWELL_MS);
          }
        } else {
          // youtube/instagram/tiktok/fallback — time-based advance
          advanceTimer = setTimeout(advance, this.EMBED_DWELL_MS);
        }
      }, 220); // matches the fade-out transition duration in CSS
    };

    const advance = () => {
      index = (index + 1) % videos.length;
      showCurrent();
    };

    showCurrent();
  },
};

// Fetches videos for a given placement and starts the carousel in a container.
// Call this from any page that has a spot for a video (hero, gallery, etc).
async function loadPlacementVideo(placement, containerEl, frameClass) {
  VideoCarousel.start(placement, containerEl, frameClass);
}
