import { useState, useRef, useEffect, useCallback, memo } from "react";

const PINK = "#ff2d55";
const BATCH = 20;

function extractVideoId(url) {
  const m = url?.match(/video\/(\d+)/);
  return m ? m[1] : null;
}
function normalizeUrl(url) {
  const id = extractVideoId(url);
  return id ? `https://www.tiktok.com/video/${id}` : url;
}
function parseMusicField(html = "") {
  const m = html.match(/>(♬[^<]+)<\/a>/);
  if (!m) return null;
  const raw = m[1].replace(/^♬\s*/, "").trim();
  const sep = raw.lastIndexOf(" - ");
  if (sep !== -1) return { song: raw.slice(0, sep).trim(), artist: raw.slice(sep + 3).trim() };
  return { song: raw, artist: "" };
}
function parseHashtags(html = "") {
  const tags = [];
  const re = /href="https:\/\/www\.tiktok\.com\/tag\/([^?]+)\?/g;
  let m;
  while ((m = re.exec(html)) !== null) tags.push(decodeURIComponent(m[1]));
  return tags;
}
function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}
function numFmt(n) {
  n = parseInt(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString();
}
function trunc(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }

const sampleJSON = `[
  {"Date":"2026-03-22 16:19:00","Link":"https://www.tiktokv.com/share/video/7619330555842432277/"},
  {"Date":"2026-03-20 11:04:00","Link":"https://www.tiktokv.com/share/video/7505155802743901462/"}
]`;

// Global oEmbed cache
const oembedCache = new Map();

async function fetchOembed(url) {
  if (!url) return null;
  const norm = normalizeUrl(url);
  if (oembedCache.has(norm)) return oembedCache.get(norm);
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(norm)}`);
    if (!res.ok) { oembedCache.set(norm, null); return null; }
    const data = await res.json();
    oembedCache.set(norm, data);
    return data;
  } catch { oembedCache.set(norm, null); return null; }
}

// ─── Inline Video Card (used everywhere links used to be) ─────────────────────
function InlineVideoCard({ url, date, compact = false }) {
  const [oembed, setOembed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOembed(url).then(d => { if (!cancelled) { setOembed(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  const videoId = oembed ? extractVideoId(url) || oembed.embed_product_id : null;
  const music = oembed ? parseMusicField(oembed.html || "") : null;
  const tags = oembed ? parseHashtags(oembed.html || "") : [];

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 10, padding: compact ? "10px 0" : "12px 0", borderBottom: "1px solid #f5f5f5", alignItems: "flex-start" }}>
        <div style={{ width: compact ? 56 : 72, height: compact ? 76 : 96, borderRadius: 10, background: "#f0f0f0", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, paddingTop: 4 }}>
          <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, width: "75%", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 10, background: "#f0f0f0", borderRadius: 6, width: "45%", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 10, background: "#f0f0f0", borderRadius: 6, width: "55%", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    );
  }

  if (!oembed) {
    return (
      <div style={{ padding: compact ? "8px 0" : "10px 0", borderBottom: "1px solid #f5f5f5" }}>
        <div style={{ fontSize: 12, color: "#ccc", background: "#fafaf8", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>Video unavailable</span>
          {date && <span style={{ marginLeft: "auto", fontSize: 11, color: "#ddd" }}>{fmt(date)}</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: "1px solid #f5f5f5", padding: compact ? "10px 0" : "12px 0" }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}
      >
        {/* Thumbnail */}
        <div style={{ width: compact ? 60 : 72, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "#111", position: "relative" }}>
          <img
            src={oembed.thumbnail_url}
            alt=""
            style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", display: "block" }}
          />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.2)", opacity: expanded ? 0 : 1, transition: "opacity 0.15s"
          }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                <path d="M1 1l8 5-8 5V1z" fill="white" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", lineHeight: 1.45, marginBottom: 5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {oembed.title || "TikTok video"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "white", fontWeight: 600, flexShrink: 0 }}>
              {(oembed.author_name || "?")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: "#888" }}>@{oembed.author_name || oembed.author_unique_id}</span>
          </div>
          {music && (
            <div style={{ fontSize: 11, color: PINK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
              ♬ {music.song}{music.artist ? ` — ${music.artist}` : ""}
            </div>
          )}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 3 }}>
              {tags.slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: 10, color: "#999", background: "#f5f5f5", padding: "2px 7px", borderRadius: 99 }}>#{t}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {date && <span style={{ fontSize: 10, color: "#ccc" }}>{fmt(date)}</span>}
            <span style={{ fontSize: 11, color: PINK, marginLeft: "auto" }}>{expanded ? "▲ collapse" : "▶ play"}</span>
          </div>
        </div>
      </div>

      {/* Expanded embed */}
      {expanded && videoId && (
        <div style={{ marginTop: 12 }}>
          <div style={{ borderRadius: 12, overflow: "hidden", background: "#111", aspectRatio: "9/16", maxWidth: 320, margin: "0 auto" }}>
            <iframe
              key={videoId}
              src={`https://www.tiktok.com/embed/v2/${videoId}?autoplay=1`}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              onClick={() => setExpanded(false)}
              style={{ fontSize: 12, color: "#bbb", background: "none", border: "none", cursor: "pointer" }}
            >
              ▲ Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video Grid (for likes, watch history, etc) ───────────────────────────────
function VideoGrid({ items, dateKey = "Date", linkKey = "Link", batchSize = 20 }) {
  const [visible, setVisible] = useState(batchSize);
  if (!items.length) return <div style={{ padding: "28px 20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>No videos</div>;

  return (
    <div style={{ padding: "0 0 8px" }}>
      {items.slice(0, visible).map((item, i) => (
        <div key={i} style={{ padding: "0 20px" }}>
          <InlineVideoCard url={item[linkKey] || item.link || item.Link} date={item[dateKey] || item.date || item.Date} />
        </div>
      ))}
      {visible < items.length && (
        <button
          onClick={() => setVisible(v => v + batchSize)}
          style={{ display: "block", width: "100%", padding: "12px", background: "transparent", border: "none", borderTop: "1px solid #f5f5f5", fontSize: 13, color: "#bbb", cursor: "pointer", marginTop: 4 }}
        >
          Show more ({items.length - visible} remaining) ↓
        </button>
      )}
    </div>
  );
}

// ─── Upload Screen ────────────────────────────────────────────────────────────
function UploadScreen({ onData }) {
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("file");
  const [linksText, setLinksText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  function loadFile(f) {
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => {
      try { onData(JSON.parse(e.target.result)); }
      catch { setStatus("Invalid JSON file. Please check the format."); }
    };
    r.readAsText(f);
  }

  async function processLinks() {
    let items;
    try { items = JSON.parse(linksText); if (!Array.isArray(items)) items = [items]; }
    catch { setStatus("Invalid JSON — check your input."); return; }
    setLoading(true);
    setStatus(`Preparing ${items.length} video${items.length > 1 ? "s" : ""}…`);
    onData({ __playlistMode: true, items });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#fafaf8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: PINK, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a.5.5 0 0 1 1 0v7l2-2a.5.5 0 1 1 .7.7l-3 3a.5.5 0 0 1-.7 0l-3-3a.5.5 0 1 1 .7-.7L8 9V2z" fill="white"/><path d="M2.5 12.5h11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}>Tik<span style={{ color: PINK }}>Tok</span>Mirror</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1, marginBottom: 10, color: "#1a1a1a", lineHeight: 1.2 }}>
          Your TikTok data,<br />beautifully organized.
        </h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.6 }}>
          Upload your full data export or paste video links. Everything stays in your browser.
        </p>
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#eeeee8", borderRadius: 12, padding: 4 }}>
          {["file", "links"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "none", background: tab === t ? "white" : "transparent", fontWeight: tab === t ? 500 : 400, fontSize: 14, cursor: "pointer", color: tab === t ? "#1a1a1a" : "#888", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
              {t === "file" ? "Full Data Export" : "Video Links"}
            </button>
          ))}
        </div>
        {tab === "file" ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${dragging ? PINK : "#ddd"}`, borderRadius: 16, padding: "52px 32px", textAlign: "center", cursor: "pointer", background: dragging ? "#fff5f7" : "white", transition: "all 0.2s" }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗂</div>
            <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 6, color: "#1a1a1a" }}>Drop your JSON file here</p>
            <p style={{ fontSize: 13, color: "#aaa" }}>or click to browse</p>
            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => loadFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1.5px solid #eee" }}>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Paste a JSON array of TikTok video links:</p>
            <textarea
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder={sampleJSON}
              style={{ width: "100%", height: 120, fontFamily: "monospace", fontSize: 12, padding: 12, border: "1px solid #eee", borderRadius: 10, background: "#fafaf8", color: "#333", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
            />
            <button
              onClick={processLinks}
              disabled={loading || !linksText.trim()}
              style={{ marginTop: 12, width: "100%", padding: "12px", background: PINK, color: "white", border: "none", borderRadius: 10, fontWeight: 500, fontSize: 15, cursor: loading || !linksText.trim() ? "not-allowed" : "pointer", opacity: loading || !linksText.trim() ? 0.6 : 1, transition: "opacity 0.15s" }}
            >
              {loading ? "Loading…" : "View Playlist →"}
            </button>
          </div>
        )}
        {status && <p style={{ marginTop: 14, fontSize: 13, color: PINK, textAlign: "center" }}>{status}</p>}
        <p style={{ marginTop: 28, fontSize: 12, color: "#bbb", lineHeight: 1.7, textAlign: "center" }}>
          TikTok app → Settings → Privacy → Download your data → Request as JSON
        </p>
      </div>
    </div>
  );
}

// ─── Playlist Video Card ──────────────────────────────────────────────────────
function PlaylistVideoCard({ item, oembed, loading, error, onClick, active }) {
  const music = oembed ? parseMusicField(oembed.html || "") : null;
  const tags = oembed ? parseHashtags(oembed.html || "") : [];
  const thumb = oembed?.thumbnail_url;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 0, cursor: "pointer",
        background: active ? "#fff0f3" : "white",
        borderLeft: `3px solid ${active ? PINK : "transparent"}`,
        borderBottom: "1px solid #f5f5f5",
        transition: "all 0.15s",
        overflow: "hidden"
      }}
    >
      <div style={{ width: 72, flexShrink: 0, position: "relative", background: "#f0f0f0" }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: "100%", height: "100%", minHeight: 96, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {loading ? <SpinnerSmall /> : error ? "⚠️" : "🎵"}
          </div>
        )}
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SpinnerSmall />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: "12px 14px" }}>
        {oembed ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", lineHeight: 1.45, marginBottom: 5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {oembed.title || "TikTok video"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 600, flexShrink: 0 }}>
                {(oembed.author_name || "?")[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: "#888" }}>@{oembed.author_name || oembed.author_unique_id}</span>
            </div>
            {music && (
              <div style={{ fontSize: 11, color: PINK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                ♬ {music.song}{music.artist ? ` — ${music.artist}` : ""}
              </div>
            )}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                {tags.slice(0, 4).map(t => (
                  <span key={t} style={{ fontSize: 10, color: "#999", background: "#f5f5f5", padding: "2px 7px", borderRadius: 99 }}>#{t}</span>
                ))}
              </div>
            )}
            {item?.Date && <div style={{ fontSize: 10, color: "#ccc" }}>{fmt(item.Date)}</div>}
          </>
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 11, background: "#f0f0f0", borderRadius: 6, width: "80%", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 11, background: "#f0f0f0", borderRadius: 6, width: "50%", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 11, background: "#f0f0f0", borderRadius: 6, width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        ) : error ? (
          <div style={{ fontSize: 12, color: "#ccc" }}>
            <div style={{ color: "#e06060", marginBottom: 4 }}>Could not load</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SpinnerSmall() {
  return <div style={{ width: 18, height: 18, border: `2px solid #eee`, borderTopColor: PINK, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────
function StatCard({ num, label }) {
  return (
    <div style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a", letterSpacing: -0.5 }}>{numFmt(num)}</div>
      <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{label}</div>
    </div>
  );
}
function Section({ title, count, children }) {
  return (
    <div style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      {title && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>{title}</span>
          {count != null && <span style={{ fontSize: 12, color: "#999", background: "#f5f5f5", padding: "3px 10px", borderRadius: 99 }}>{numFmt(count)}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
function DataTable({ heads, rows, limit = 20 }) {
  const [show, setShow] = useState(limit);
  if (!rows.length) return <div style={{ padding: "28px 20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>No data</div>;
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>{heads.map((h, i) => <th key={i} style={{ padding: "10px 20px", textAlign: "left", color: "#bbb", fontWeight: 400, borderBottom: "1px solid #f5f5f5", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, show).map((row, i) => (
              <tr key={i} style={{ borderBottom: i < Math.min(show, rows.length) - 1 ? "1px solid #f8f8f8" : "none" }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "10px 20px", color: "#333", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > show && (
        <button onClick={() => setShow(rows.length)} style={{ display: "block", width: "100%", padding: "11px", background: "transparent", border: "none", borderTop: "1px solid #f5f5f5", fontSize: 13, color: "#bbb", cursor: "pointer" }}>
          Show all {rows.length} rows ↓
        </button>
      )}
    </>
  );
}
function Tag({ children, accent }) {
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", background: accent ? "#fff0f3" : "#f5f5f5", color: accent ? PINK : "#555", borderRadius: 99, fontSize: 13, border: accent ? `1px solid ${PINK}33` : "1px solid #eee", margin: "3px 3px 3px 0" }}>
      {children}
    </span>
  );
}

// ─── Tab Components ──────────────────────────────────────────────────────────

function OverviewTab({ data }) {
  const p = data["Profile And Settings"]?.["Profile Info"]?.["ProfileMap"] || {};
  const posts = data["Post"]?.["Posts"]?.["VideoList"] || [];
  const likes = data["Likes and Favorites"]?.["Like List"]?.["ItemFavoriteList"] || [];
  const favVids = data["Likes and Favorites"]?.["Favorite Videos"]?.["FavoriteVideoList"] || [];
  const comments = data["Comment"]?.["Comments"]?.["CommentsList"] || [];
  const searches = data["Your Activity"]?.["Searches"]?.["SearchList"] || [];
  const watches = data["Your Activity"]?.["Watch History"]?.["VideoList"] || [];
  const followers = data["Profile And Settings"]?.["Follower"]?.["FansList"] || [];
  const following = data["Profile And Settings"]?.["Following"]?.["Following"] || [];
  const name = p.displayName || p.userName || "?";
  return (
    <div>
      {p.userName && (
        <div style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 20, padding: "28px 24px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 500, color: "white", flexShrink: 0 }}>
            {(name[0] || "?").toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a", letterSpacing: -0.5, marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 14, color: "#aaa" }}>@{p.userName}{p.accountRegion ? ` · ${p.accountRegion}` : ""}</div>
            {p.bioDescription && <div style={{ marginTop: 10, fontSize: 14, color: "#555", lineHeight: 1.6 }}>{p.bioDescription}</div>}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
        <StatCard num={posts.length} label="Posts" />
        <StatCard num={likes.length} label="Liked videos" />
        <StatCard num={favVids.length} label="Favorites" />
        <StatCard num={comments.length} label="Comments" />
        <StatCard num={searches.length} label="Searches" />
        <StatCard num={watches.length} label="Watched" />
        <StatCard num={followers.length} label="Followers" />
        <StatCard num={following.length} label="Following" />
      </div>
    </div>
  );
}

function ProfileTab({ data }) {
  const d = data["Profile And Settings"];
  const p = d?.["Profile Info"]?.["ProfileMap"] || {};
  const followers = d?.["Follower"]?.["FansList"] || [];
  const following = d?.["Following"]?.["Following"] || [];
  const blocks = d?.["Block List"]?.["BlockList"] || [];
  const name = p.displayName || p.userName || "?";
  const fields = [
    p.birthDate && ["Birthday", p.birthDate],
    p.emailAddress && ["Email", p.emailAddress],
    p.telephoneNumber && ["Phone", p.telephoneNumber],
    p.accountRegion && ["Region", p.accountRegion],
    p.followerCount != null && ["Followers", numFmt(p.followerCount)],
    p.followingCount != null && ["Following", numFmt(p.followingCount)],
    p.likesReceived && ["Likes received", p.likesReceived],
    p.inferredGender && ["Inferred gender", p.inferredGender],
  ].filter(Boolean);
  return (
    <div>
      {fields.length > 0 && (
        <Section title={name}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {fields.map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #f8f8f8" }}>
                  <td style={{ padding: "12px 20px", color: "#aaa", width: 160 }}>{k}</td>
                  <td style={{ padding: "12px 20px", color: "#1a1a1a", fontWeight: 500 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {followers.length > 0 && (
          <Section title="Followers" count={followers.length}>
            <DataTable heads={["Date", "Username"]} rows={followers.map(f => [<span style={{ color: "#ccc", fontSize: 11 }}>{fmt(f.Date)}</span>, `@${f.UserName}`])} />
          </Section>
        )}
        {following.length > 0 && (
          <Section title="Following" count={following.length}>
            <DataTable heads={["Date", "Username"]} rows={following.map(f => [<span style={{ color: "#ccc", fontSize: 11 }}>{fmt(f.Date)}</span>, `@${f.UserName}`])} />
          </Section>
        )}
      </div>
      {blocks.length > 0 && (
        <Section title="Blocked users" count={blocks.length}>
          <DataTable heads={["Date", "Username"]} rows={blocks.map(b => [<span style={{ color: "#ccc", fontSize: 11 }}>{fmt(b.Date)}</span>, `@${b.UserName}`])} />
        </Section>
      )}
    </div>
  );
}

// ─── SEPARATED TAB COMPONENTS ─────────────────────────────────────────────────

function TopSearchesTab({ data }) {
  const searches = data["Your Activity"]?.["Searches"]?.["SearchList"] || [];
  if (!searches.length) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>No searches found</div>;

  return (
    <div>
      <Section title="Searches list" count={searches.length}>
        <DataTable heads={["Date", "Search Term"]} rows={searches.map(s => [
          <span style={{ color: "#ccc", fontSize: 11 }}>{fmt(s.Date)}</span>,
          s.SearchTerm || "—"
        ])} />
      </Section>
    </div>
  );
}

function WatchHistoryTab({ data }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("original"); // original, reverse, random

  const watches = data["Your Activity"]?.["Watch History"]?.["VideoList"] || [];
  if (!watches.length) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>No watch history</div>;

  // Filter videos by date range
  const filteredWatches = watches.filter(item => {
    if (!item.Date) return true;
    try {
      const d = new Date(item.Date);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    } catch {
      return true;
    }
  });

  // Apply sort order to videos
  const displayWatches = sortOrder === "reverse" 
    ? [...filteredWatches].reverse() 
    : sortOrder === "random" 
    ? [...filteredWatches].sort(() => Math.random() - 0.5)
    : filteredWatches;

  // Calculate date range for data coverage
  const dates = watches
    .map(item => item.Date)
    .filter(d => d)
    .map(d => new Date(d))
    .sort((a, b) => a - b);
  
  const oldestDate = dates.length > 0 ? dates[0] : null;
  const newestDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const daysCovered = oldestDate && newestDate ? Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)) + 1 : 0;

  return (
    <div>
      {oldestDate && newestDate && (
        <div style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 }}>Data Coverage</div>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              style={{ padding: "6px 14px", background: showCalendar ? PINK : "#f5f5f5", border: "1.5px solid", borderColor: showCalendar ? PINK : "#ddd", borderRadius: 8, fontSize: 12, cursor: "pointer", color: showCalendar ? "white" : "#666", fontWeight: 500, transition: "all 0.15s" }}
            >
              📅 Calendar
            </button>
          </div>
          
          {showCalendar && (
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1.5px solid #f0f0f0" }}>
              <MonthCalendarFilter dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            <div style={{ padding: "12px 0" }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>Total Videos</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", letterSpacing: -0.8 }}>{numFmt(filteredWatches.length)}</div>
            </div>
            <div style={{ padding: "12px 0" }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>Time Wasted</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: PINK, letterSpacing: -0.8 }}>
                {filteredWatches.length >= 60 ? `${Math.floor(filteredWatches.length / 60)}h ${filteredWatches.length % 60}m` : `${filteredWatches.length}m`}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1.5px solid #f0f0f0", fontSize: 12, color: "#666" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: "#aaa" }}>From:</span> <strong style={{ color: "#1a1a1a" }}>{fmt(oldestDate)}</strong>
            </div>
            <div>
              <span style={{ color: "#aaa" }}>Until:</span> <strong style={{ color: "#1a1a1a" }}>{fmt(newestDate)}</strong>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>View Order</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSortOrder("original")}
            style={{
              padding: "8px 14px",
              background: sortOrder === "original" ? PINK : "#f5f5f5",
              border: "1.5px solid",
              borderColor: sortOrder === "original" ? PINK : "#ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: sortOrder === "original" ? 600 : 500,
              cursor: "pointer",
              color: sortOrder === "original" ? "white" : "#666",
              transition: "all 0.15s"
            }}
          >
            Original
          </button>
          <button
            onClick={() => setSortOrder("reverse")}
            style={{
              padding: "8px 14px",
              background: sortOrder === "reverse" ? PINK : "#f5f5f5",
              border: "1.5px solid",
              borderColor: sortOrder === "reverse" ? PINK : "#ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: sortOrder === "reverse" ? 600 : 500,
              cursor: "pointer",
              color: sortOrder === "reverse" ? "white" : "#666",
              transition: "all 0.15s"
            }}
          >
            Reverse
          </button>
          <button
            onClick={() => setSortOrder("random")}
            style={{
              padding: "8px 14px",
              background: sortOrder === "random" ? PINK : "#f5f5f5",
              border: "1.5px solid",
              borderColor: sortOrder === "random" ? PINK : "#ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: sortOrder === "random" ? 600 : 500,
              cursor: "pointer",
              color: sortOrder === "random" ? "white" : "#666",
              transition: "all 0.15s"
            }}
          >
            Random
          </button>
        </div>
      </div>
      <Section title="Watch history" count={filteredWatches.length}>
        <VideoGrid items={displayWatches} dateKey="Date" linkKey="Link" />
      </Section>
    </div>
  );
}

function LikedVideosTab({ data }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("original"); // original, reverse, random

  const likes = data["Likes and Favorites"]?.["Like List"]?.["ItemFavoriteList"] || [];
  if (!likes.length) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>No liked videos</div>;

  // Filter videos by date range
  const filteredLikes = likes.filter(item => {
    if (!item.date) return true;
    try {
      const d = new Date(item.date);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    } catch {
      return true;
    }
  });

  // Apply sort order to videos
  const displayLikes = sortOrder === "reverse" 
    ? [...filteredLikes].reverse() 
    : sortOrder === "random" 
    ? [...filteredLikes].sort(() => Math.random() - 0.5)
    : filteredLikes;

  // Calculate date range for data coverage
  const dates = likes
    .map(item => item.date)
    .filter(d => d)
    .map(d => new Date(d))
    .sort((a, b) => a - b);
  
  const oldestDate = dates.length > 0 ? dates[0] : null;
  const newestDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const daysCovered = oldestDate && newestDate ? Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)) + 1 : 0;

  return (
    <div>
      {oldestDate && newestDate && (
        <div style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 }}>Data Coverage</div>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              style={{ padding: "6px 14px", background: showCalendar ? PINK : "#f5f5f5", border: "1.5px solid", borderColor: showCalendar ? PINK : "#ddd", borderRadius: 8, fontSize: 12, cursor: "pointer", color: showCalendar ? "white" : "#666", fontWeight: 500, transition: "all 0.15s" }}
            >
              📅 Calendar
            </button>
          </div>
          
          {showCalendar && (
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1.5px solid #f0f0f0" }}>
              <MonthCalendarFilter dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            <div style={{ padding: "12px 0" }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>Total Videos</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", letterSpacing: -0.8 }}>{numFmt(filteredLikes.length)}</div>
            </div>
            <div style={{ padding: "12px 0" }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>Time Wasted</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: PINK, letterSpacing: -0.8 }}>
                {filteredLikes.length >= 60 ? `${Math.floor(filteredLikes.length / 60)}h ${filteredLikes.length % 60}m` : `${filteredLikes.length}m`}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1.5px solid #f0f0f0", fontSize: 12, color: "#666" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: "#aaa" }}>From:</span> <strong style={{ color: "#1a1a1a" }}>{fmt(oldestDate)}</strong>
            </div>
            <div>
              <span style={{ color: "#aaa" }}>Until:</span> <strong style={{ color: "#1a1a1a" }}>{fmt(newestDate)}</strong>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>View Order</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSortOrder("original")}
            style={{
              padding: "8px 14px",
              background: sortOrder === "original" ? PINK : "#f5f5f5",
              border: "1.5px solid",
              borderColor: sortOrder === "original" ? PINK : "#ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: sortOrder === "original" ? 600 : 500,
              cursor: "pointer",
              color: sortOrder === "original" ? "white" : "#666",
              transition: "all 0.15s"
            }}
          >
            Original
          </button>
          <button
            onClick={() => setSortOrder("reverse")}
            style={{
              padding: "8px 14px",
              background: sortOrder === "reverse" ? PINK : "#f5f5f5",
              border: "1.5px solid",
              borderColor: sortOrder === "reverse" ? PINK : "#ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: sortOrder === "reverse" ? 600 : 500,
              cursor: "pointer",
              color: sortOrder === "reverse" ? "white" : "#666",
              transition: "all 0.15s"
            }}
          >
            Reverse
          </button>
          <button
            onClick={() => setSortOrder("random")}
            style={{
              padding: "8px 14px",
              background: sortOrder === "random" ? PINK : "#f5f5f5",
              border: "1.5px solid",
              borderColor: sortOrder === "random" ? PINK : "#ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: sortOrder === "random" ? 600 : 500,
              cursor: "pointer",
              color: sortOrder === "random" ? "white" : "#666",
              transition: "all 0.15s"
            }}
          >
            Random
          </button>
        </div>
      </div>
      <Section title="Liked videos" count={filteredLikes.length}>
        <VideoGrid items={displayLikes} dateKey="date" linkKey="link" />
      </Section>
    </div>
  );
}

function FavoriteVideosTab({ data }) {
  const favVids = data["Likes and Favorites"]?.["Favorite Videos"]?.["FavoriteVideoList"] || [];
  if (!favVids.length) return <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>No favorite videos</div>;

  return (
    <div>
      <Section title="Favorite videos" count={favVids.length}>
        <VideoGrid items={favVids} dateKey="Date" linkKey="Link" />
      </Section>
    </div>
  );
}


// ─── TAB CONFIGURATION ────────────────────────────────────────────────────────

const ALL_TABS = [
  { id: "overview", label: "Overview", check: () => true },
  { id: "profile", label: "Profile", check: (d) => !!d["Profile And Settings"] },
  { id: "top-searches", label: "Searches List", check: (d) => !!d["Your Activity"]?.["Searches"]?.["SearchList"]?.length },
  { id: "watch-history", label: "Watch History", check: (d) => !!d["Your Activity"]?.["Watch History"]?.["VideoList"]?.length },
  { id: "liked-videos", label: "Liked Videos", check: (d) => !!d["Likes and Favorites"]?.["Like List"]?.["ItemFavoriteList"]?.length },
  { id: "favorite-videos", label: "Favorite Videos", check: (d) => !!d["Likes and Favorites"]?.["Favorite Videos"]?.["FavoriteVideoList"]?.length },
];

function MonthCalendarFilter({ dateFrom, dateTo, setDateFrom, setDateTo }) {
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const handleMonthClick = (monthIdx) => {
    const fromDate = new Date(displayYear, monthIdx, 1);
    const toDate = new Date(displayYear, monthIdx + 1, 0);
    setDateFrom(fromDate.toISOString().split('T')[0]);
    setDateTo(toDate.toISOString().split('T')[0]);
  };
  
  const isMonthSelected = (monthIdx) => {
    if (!dateFrom) return false;
    const from = new Date(dateFrom);
    return from.getFullYear() === displayYear && from.getMonth() === monthIdx;
  };
  
  const minYear = 2015;
  const maxYear = new Date().getFullYear();
  
  return (
    <div style={{ padding: "16px 0" }}>
      {/* Year Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e5e5e5" }}>
        <button 
          onClick={() => setDisplayYear(Math.max(minYear, displayYear - 1))}
          disabled={displayYear <= minYear}
          style={{ padding: "6px 12px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, cursor: displayYear > minYear ? "pointer" : "not-allowed", color: displayYear > minYear ? "#333" : "#ccc", fontWeight: 500 }}
        >
          Prev
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{displayYear}</span>
        <button 
          onClick={() => setDisplayYear(Math.min(maxYear, displayYear + 1))}
          disabled={displayYear >= maxYear}
          style={{ padding: "6px 12px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, cursor: displayYear < maxYear ? "pointer" : "not-allowed", color: displayYear < maxYear ? "#333" : "#ccc", fontWeight: 500 }}
        >
          Next
        </button>
      </div>
      
      {/* Months Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {months.map((month, idx) => (
          <button
            key={idx}
            onClick={() => handleMonthClick(idx)}
            style={{
              padding: "10px 8px",
              background: isMonthSelected(idx) ? PINK : "white",
              border: isMonthSelected(idx) ? `1.5px solid ${PINK}` : "1px solid #ddd",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: isMonthSelected(idx) ? 600 : 500,
              cursor: "pointer",
              color: isMonthSelected(idx) ? "white" : "#333",
              transition: "all 0.15s"
            }}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
}

function FullDataViewer({ data, onReset }) {
  const [activeTab, setActiveTab] = useState("overview");
  const p = data["Profile And Settings"]?.["Profile Info"]?.["ProfileMap"] || {};
  const tabs = ALL_TABS.filter(t => t.check(data));

  // Helper function to check if date falls within range (for overview tab)
  function isDateInRange(dateStr) {
    // Overview tab doesn't filter, so always return true
    return true;
  }

  // Create filtered data object
  const filteredData = {
    ...data,
    "Your Activity": {
      ...data["Your Activity"],
      "Searches": {
        ...data["Your Activity"]?.["Searches"],
        "SearchList": (data["Your Activity"]?.["Searches"]?.["SearchList"] || []).filter(s => isDateInRange(s.Date))
      },
      "Watch History": {
        ...data["Your Activity"]?.["Watch History"],
        "VideoList": (data["Your Activity"]?.["Watch History"]?.["VideoList"] || []).filter(v => isDateInRange(v.Date))
      }
    },
    "Likes and Favorites": {
      ...data["Likes and Favorites"],
      "Like List": {
        ...data["Likes and Favorites"]?.["Like List"],
        "ItemFavoriteList": (data["Likes and Favorites"]?.["Like List"]?.["ItemFavoriteList"] || []).filter(l => isDateInRange(l.date))
      },
      "Favorite Videos": {
        ...data["Likes and Favorites"]?.["Favorite Videos"],
        "FavoriteVideoList": (data["Likes and Favorites"]?.["Favorite Videos"]?.["FavoriteVideoList"] || []).filter(f => isDateInRange(f.date))
      }
    }
  };

  function renderTab() {
    switch (activeTab) {
      case "overview": return <OverviewTab data={data} />;
      case "profile": return <ProfileTab data={data} />;
      case "top-searches": return <TopSearchesTab data={filteredData} />;
      case "watch-history": return <WatchHistoryTab data={filteredData} />;
      case "liked-videos": return <LikedVideosTab data={filteredData} />;
      case "favorite-videos": return <FavoriteVideosTab data={filteredData} />;
      default: return <OverviewTab data={data} />;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ background: "white", borderBottom: "1.5px solid #f0f0f0", padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: PINK, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2a.5.5 0 0 1 1 0v7l2-2a.5.5 0 1 1 .7.7l-3 3a.5.5 0 0 1-.7 0l-3-3a.5.5 0 1 1 .7-.7L8 9V2z" fill="white"/><path d="M2.5 12.5h11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}>Tik<span style={{ color: PINK }}>Tok</span>Mirror</span>
          {p.userName && <span style={{ fontSize: 12, color: "#aaa", background: "#f5f5f5", padding: "4px 12px", borderRadius: 99 }}>@{p.userName}</span>}
          <span style={{ flex: 1 }} />
          <button onClick={onReset} style={{ padding: "8px 18px", background: "white", border: "1.5px solid #ddd", borderRadius: 9, fontSize: 13, cursor: "pointer", color: "#666", fontWeight: 500, transition: "all 0.15s", hover: { background: "#f5f5f5" } }}>New file</button>
        </div>
      </div>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "0 20px" }}>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "7px 18px", borderRadius: 99, border: "1.5px solid", borderColor: activeTab === t.id ? PINK : "#eee", background: activeTab === t.id ? PINK : "white", color: activeTab === t.id ? "white" : "#666", fontSize: 13, fontWeight: activeTab === t.id ? 500 : 400, cursor: "pointer", transition: "all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>
        {renderTab()}
        </div>
    </div>
  );
}

export default function App() {
  const [appData, setAppData] = useState(null);
  if (!appData) return <UploadScreen onData={setAppData} />;
  if (appData.__playlistMode) return <PlaylistView items={appData.items} onReset={() => setAppData(null)} />;
  return <FullDataViewer data={appData} onReset={() => setAppData(null)} />;
}
