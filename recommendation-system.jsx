import { useState, useMemo } from "react";

const MOVIES = [
  { id: 1, title: "Inception", genres: ["Sci-Fi", "Thriller", "Mystery"], year: 2010, rating: 8.8, poster: "🌀" },
  { id: 2, title: "The Dark Knight", genres: ["Action", "Thriller", "Crime"], year: 2008, rating: 9.0, poster: "🦇" },
  { id: 3, title: "Interstellar", genres: ["Sci-Fi", "Drama", "Adventure"], year: 2014, rating: 8.6, poster: "🚀" },
  { id: 4, title: "Parasite", genres: ["Drama", "Thriller", "Mystery"], year: 2019, rating: 8.5, poster: "🏠" },
  { id: 5, title: "The Matrix", genres: ["Sci-Fi", "Action"], year: 1999, rating: 8.7, poster: "💊" },
  { id: 6, title: "Pulp Fiction", genres: ["Crime", "Drama"], year: 1994, rating: 8.9, poster: "🎬" },
  { id: 7, title: "The Shawshank Redemption", genres: ["Drama"], year: 1994, rating: 9.3, poster: "🔑" },
  { id: 8, title: "Fight Club", genres: ["Drama", "Thriller"], year: 1999, rating: 8.8, poster: "👊" },
  { id: 9, title: "Forrest Gump", genres: ["Drama", "Romance", "Comedy"], year: 1994, rating: 8.8, poster: "🍫" },
  { id: 10, title: "Goodfellas", genres: ["Crime", "Drama", "Biography"], year: 1990, rating: 8.7, poster: "🔫" },
  { id: 11, title: "The Silence of the Lambs", genres: ["Thriller", "Crime", "Mystery"], year: 1991, rating: 8.6, poster: "🦋" },
  { id: 12, title: "Schindler's List", genres: ["Biography", "Drama", "History"], year: 1993, rating: 9.0, poster: "📋" },
  { id: 13, title: "WALL-E", genres: ["Animation", "Sci-Fi", "Comedy"], year: 2008, rating: 8.4, poster: "🤖" },
  { id: 14, title: "Whiplash", genres: ["Drama", "Music"], year: 2014, rating: 8.5, poster: "🥁" },
  { id: 15, title: "Mad Max: Fury Road", genres: ["Action", "Adventure", "Sci-Fi"], year: 2015, rating: 8.1, poster: "🔥" },
  { id: 16, title: "Blade Runner 2049", genres: ["Sci-Fi", "Mystery", "Drama"], year: 2017, rating: 8.0, poster: "🌆" },
  { id: 17, title: "Her", genres: ["Romance", "Drama", "Sci-Fi"], year: 2013, rating: 8.0, poster: "💌" },
  { id: 18, title: "1917", genres: ["Drama", "History", "Thriller"], year: 2019, rating: 8.3, poster: "⚔️" },
  { id: 19, title: "Knives Out", genres: ["Mystery", "Comedy", "Crime"], year: 2019, rating: 7.9, poster: "🔪" },
  { id: 20, title: "The Grand Budapest Hotel", genres: ["Comedy", "Drama", "Mystery"], year: 2014, rating: 8.1, poster: "🏨" },
];

const USERS = [
  { id: "u1", name: "Alex", ratings: { 1: 5, 2: 4, 3: 5, 5: 4, 16: 3, 13: 2 } },
  { id: "u2", name: "Jordan", ratings: { 1: 3, 4: 5, 6: 5, 8: 4, 11: 4, 19: 5 } },
  { id: "u3", name: "Sam", ratings: { 3: 5, 7: 5, 9: 4, 12: 5, 14: 4, 18: 5 } },
  { id: "u4", name: "Riley", ratings: { 2: 5, 6: 4, 10: 5, 11: 5, 15: 4, 8: 3 } },
  { id: "u5", name: "Morgan", ratings: { 1: 4, 3: 4, 5: 5, 13: 5, 16: 5, 17: 4 } },
  { id: "u6", name: "Casey", ratings: { 4: 4, 7: 4, 9: 5, 17: 5, 19: 4, 20: 5 } },
];

const ALL_GENRES = [...new Set(MOVIES.flatMap(m => m.genres))].sort();

function cosineSimilarity(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, normA = 0, normB = 0;
  keys.forEach(k => {
    const va = a[k] || 0, vb = b[k] || 0;
    dot += va * vb; normA += va * va; normB += vb * vb;
  });
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function collaborativeFilter(userRatings, allUsers, movies, topN = 5) {
  const similarities = allUsers.map(u => ({
    user: u,
    sim: cosineSimilarity(userRatings, u.ratings),
  })).filter(x => x.sim > 0).sort((a, b) => b.sim - a.sim).slice(0, 3);

  const scores = {};
  similarities.forEach(({ user, sim }) => {
    Object.entries(user.ratings).forEach(([mid, rating]) => {
      if (!userRatings[mid]) {
        scores[mid] = (scores[mid] || 0) + sim * rating;
      }
    });
  });

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, score]) => ({ movie: movies.find(m => m.id === parseInt(id)), score: +(score).toFixed(2), reason: "collaborative" }))
    .filter(x => x.movie);
}

function contentFilter(userRatings, movies, topN = 5) {
  const likedMovies = movies.filter(m => (userRatings[m.id] || 0) >= 4);
  if (!likedMovies.length) return [];
  const genreWeights = {};
  likedMovies.forEach(m => {
    m.genres.forEach(g => { genreWeights[g] = (genreWeights[g] || 0) + 1; });
  });
  const unrated = movies.filter(m => !userRatings[m.id]);
  return unrated.map(m => {
    const score = m.genres.reduce((acc, g) => acc + (genreWeights[g] || 0), 0) * 0.6 + m.rating * 0.4;
    return { movie: m, score: +score.toFixed(2), reason: "content" };
  }).sort((a, b) => b.score - a.score).slice(0, topN);
}

function hybridFilter(userRatings, allUsers, movies, topN = 5) {
  const cf = collaborativeFilter(userRatings, allUsers, movies, 10);
  const cb = contentFilter(userRatings, movies, 10);
  const combined = {};
  cf.forEach(({ movie, score }) => { combined[movie.id] = (combined[movie.id] || 0) + score * 0.6; });
  cb.forEach(({ movie, score }) => { combined[movie.id] = (combined[movie.id] || 0) + score * 0.4; });
  return Object.entries(combined)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, score]) => ({ movie: movies.find(m => m.id === parseInt(id)), score: +score.toFixed(2), reason: "hybrid" }))
    .filter(x => x.movie);
}

const BADGE = { collaborative: { label: "Collaborative", bg: "#E6F1FB", color: "#185FA5" }, content: { label: "Content-based", bg: "#EAF3DE", color: "#3B6D11" }, hybrid: { label: "Hybrid", bg: "#EEEDFE", color: "#534AB7" } };

const STARS = (r) => "★".repeat(r) + "☆".repeat(5 - r);

export default function App() {
  const [userRatings, setUserRatings] = useState({});
  const [method, setMethod] = useState("hybrid");
  const [activeTab, setActiveTab] = useState("rate");
  const [genreFilter, setGenreFilter] = useState([]);
  const [hoverMovie, setHoverMovie] = useState(null);

  const ratedCount = Object.keys(userRatings).length;

  const recommendations = useMemo(() => {
    if (ratedCount < 2) return [];
    const base = method === "collaborative" ? collaborativeFilter(userRatings, USERS, MOVIES)
      : method === "content" ? contentFilter(userRatings, MOVIES)
      : hybridFilter(userRatings, USERS, MOVIES);
    if (!genreFilter.length) return base;
    return base.filter(({ movie }) => movie.genres.some(g => genreFilter.includes(g)));
  }, [userRatings, method, genreFilter, ratedCount]);

  const browseMovies = useMemo(() => {
    if (!genreFilter.length) return MOVIES;
    return MOVIES.filter(m => m.genres.some(g => genreFilter.includes(g)));
  }, [genreFilter]);

  const toggleGenre = (g) => setGenreFilter(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const setRating = (mid, r) => setUserRatings(prev => ({ ...prev, [mid]: r }));
  const removeRating = (mid) => setUserRatings(prev => { const n = { ...prev }; delete n[mid]; return n; });

  const tabStyle = (t) => ({
    padding: "8px 20px", fontSize: 14, cursor: "pointer", borderRadius: 20,
    background: activeTab === t ? "#1a1a2e" : "transparent",
    color: activeTab === t ? "#fff" : "#888",
    border: "none", fontWeight: activeTab === t ? 500 : 400, transition: "all 0.2s",
  });

  const methodBtn = (m, label, icon) => ({
    padding: "7px 14px", fontSize: 13, cursor: "pointer", borderRadius: 8,
    background: method === m ? "#1a1a2e" : "#f5f5f5",
    color: method === m ? "#fff" : "#555",
    border: method === m ? "none" : "1px solid #e0e0e0",
    display: "flex", alignItems: "center", gap: 6, fontWeight: 500, transition: "all 0.2s",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#fafaf8", minHeight: "100vh", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .movie-card { transition: transform 0.18s, box-shadow 0.18s; cursor: pointer; }
        .movie-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .star { cursor: pointer; font-size: 18px; transition: color 0.1s; line-height: 1; }
        .star:hover, .star.active { color: #f5a623; }
        .genre-pill { cursor: pointer; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; transition: all 0.15s; border: 1.5px solid #e0e0e0; background: #fff; color: #555; }
        .genre-pill.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
        .rec-bar { height: 4px; border-radius: 2px; background: linear-gradient(90deg, #534AB7, #1D9E75); transition: width 0.5s; }
        .method-btn { transition: all 0.2s; }
        .method-btn:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1a1a2e", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, color: "#fff", letterSpacing: -0.5 }}>🎬 CineMatch</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>AI-Powered Movie Recommendations</div>
        </div>
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.07)", borderRadius: 24, padding: 4 }}>
          <button style={tabStyle("rate")} onClick={() => setActiveTab("rate")}>Rate Movies</button>
          <button style={tabStyle("discover")} onClick={() => setActiveTab("discover")}>Discover</button>
          <button style={tabStyle("about")} onClick={() => setActiveTab("about")}>How It Works</button>
        </div>
        <div style={{ fontSize: 13, color: "#888" }}>
          <span style={{ color: ratedCount >= 2 ? "#5DCAA5" : "#f5a623" }}>●</span>{" "}
          {ratedCount} rated {ratedCount < 2 ? "— rate 2+ to unlock recs" : ""}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>

        {/* Genre Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {ALL_GENRES.map(g => (
            <button key={g} className={`genre-pill ${genreFilter.includes(g) ? "active" : ""}`} onClick={() => toggleGenre(g)}>{g}</button>
          ))}
          {genreFilter.length > 0 && (
            <button className="genre-pill" style={{ color: "#e24b4a", borderColor: "#f09595" }} onClick={() => setGenreFilter([])}>✕ Clear</button>
          )}
        </div>

        {/* RATE TAB */}
        {activeTab === "rate" && (
          <div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
              Rate movies you've seen to unlock personalized recommendations. <strong>Higher ratings = stronger signal.</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {browseMovies.map(movie => {
                const rated = userRatings[movie.id];
                return (
                  <div key={movie.id} className="movie-card" style={{
                    background: "#fff", borderRadius: 12, padding: "14px 16px",
                    border: rated ? "2px solid #534AB7" : "1px solid #ebebeb",
                    position: "relative",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ fontSize: 32, width: 44, textAlign: "center", flexShrink: 0 }}>{movie.poster}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>{movie.title}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>{movie.year} · ⭐ {movie.rating}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {movie.genres.slice(0, 3).map(g => (
                            <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#f0f0f0", color: "#666" }}>{g}</span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`star ${rated >= s ? "active" : ""}`}
                              style={{ color: rated >= s ? "#f5a623" : "#ddd" }}
                              onClick={() => rated === s ? removeRating(movie.id) : setRating(movie.id, s)}>★</span>
                          ))}
                          {rated && <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>Your rating: {rated}/5</span>}
                        </div>
                      </div>
                    </div>
                    {rated && <div style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: "50%", background: "#534AB7" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === "discover" && (
          <div>
            {/* Method selector */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#888", marginRight: 4 }}>Algorithm:</span>
              {[["hybrid", "🔀 Hybrid", "#534AB7"], ["collaborative", "👥 Collaborative", "#185FA5"], ["content", "🎯 Content-Based", "#3B6D11"]].map(([m, label, color]) => (
                <button key={m} className="method-btn" style={{
                  ...methodBtn(m),
                  ...(method === m ? { background: color } : {}),
                }} onClick={() => setMethod(m)}>{label}</button>
              ))}
            </div>

            {ratedCount < 2 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#555" }}>Rate at least 2 movies to get recommendations</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Switch to the <strong>Rate Movies</strong> tab to get started</div>
              </div>
            ) : recommendations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15 }}>No recommendations found for current filters</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                  Showing {recommendations.length} recommendations based on your {ratedCount} ratings
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {recommendations.map(({ movie, score, reason }, idx) => {
                    const badge = BADGE[method] || BADGE.hybrid;
                    const maxScore = recommendations[0]?.score || 1;
                    const pct = Math.min(100, Math.round((score / maxScore) * 100));
                    return (
                      <div key={movie.id} style={{
                        background: "#fff", borderRadius: 14, padding: "16px 20px",
                        border: idx === 0 ? "2px solid #534AB7" : "1px solid #ebebeb",
                        display: "flex", gap: 16, alignItems: "center",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: idx === 0 ? "#534AB7" : "#ccc", width: 24, textAlign: "center" }}>#{idx + 1}</div>
                        <div style={{ fontSize: 36, width: 44, textAlign: "center", flexShrink: 0 }}>{movie.poster}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{movie.title}</div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: badge.bg, color: badge.color, fontWeight: 500 }}>
                              {badge.label}
                            </span>
                            {idx === 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#EEEDFE", color: "#534AB7", fontWeight: 600 }}>Top Pick</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
                            {movie.year} · ⭐ {movie.rating} · {movie.genres.join(", ")}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 4, overflow: "hidden" }}>
                              <div className="rec-bar" style={{ width: `${pct}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#888", minWidth: 40 }}>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              {
                icon: "👥", title: "Collaborative Filtering", color: "#E6F1FB", accent: "#185FA5",
                desc: "Finds users with similar taste by computing cosine similarity between rating vectors. Movies loved by your 'taste-twins' that you haven't seen yet rise to the top.",
                howTo: "Rate movies → system finds similar users → surfaces their favorites",
              },
              {
                icon: "🎯", title: "Content-Based Filtering", color: "#EAF3DE", accent: "#3B6D11",
                desc: "Analyzes genre patterns from your highest-rated films. Builds a weighted genre profile and scores unrated movies by how well they match your preferences.",
                howTo: "Rate ≥4★ movies → extract genres → score similar unrated films",
              },
              {
                icon: "🔀", title: "Hybrid (Recommended)", color: "#EEEDFE", accent: "#534AB7",
                desc: "Combines both signals: 60% collaborative (social proof) + 40% content (genre match). Handles cold-start for niche films while capturing cross-genre serendipity.",
                howTo: "Best of both worlds — more robust, fewer blind spots",
              },
            ].map(({ icon, title, color, accent, desc, howTo }) => (
              <div key={title} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ebebeb" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>
                  {icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: accent }}>{title}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>{desc}</div>
                <div style={{ fontSize: 12, background: color, borderRadius: 8, padding: "8px 12px", color: accent, fontWeight: 500 }}>
                  → {howTo}
                </div>
              </div>
            ))}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ebebeb", gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>📊 Similarity Formula (Cosine Similarity)</div>
              <code style={{ display: "block", background: "#f8f8f8", padding: "12px 16px", borderRadius: 8, fontSize: 13, color: "#333", lineHeight: 1.7 }}>
                similarity(A, B) = (A · B) / (‖A‖ × ‖B‖)<br />
                where A, B = rating vectors, · = dot product, ‖·‖ = vector norm<br /><br />
                <span style={{ color: "#888" }}>// Higher similarity → stronger influence on recommendations</span>
              </code>
            </div>
          </div>
        )}

        {/* Floating rated summary */}
        {ratedCount > 0 && (
          <div style={{
            marginTop: 28, background: "#1a1a2e", borderRadius: 12, padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <div style={{ color: "#fff", fontSize: 14 }}>
              <strong>{ratedCount}</strong> <span style={{ color: "#888" }}>movies rated</span>
              {Object.values(userRatings).filter(r => r >= 4).length > 0 &&
                <span style={{ color: "#5DCAA5", marginLeft: 12 }}>
                  ♥ {Object.values(userRatings).filter(r => r >= 4).length} loved
                </span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(userRatings).slice(-4).map(([mid, rating]) => {
                const m = MOVIES.find(x => x.id === parseInt(mid));
                return m ? (
                  <div key={mid} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#ddd" }}>
                    {m.poster} {Array(rating).fill("★").join("")}
                  </div>
                ) : null;
              })}
              {ratedCount > 4 && <div style={{ color: "#888", fontSize: 12, padding: "4px 6px" }}>+{ratedCount - 4} more</div>}
            </div>
            {ratedCount >= 2 && activeTab !== "discover" && (
              <button onClick={() => setActiveTab("discover")} style={{
                background: "#534AB7", color: "#fff", border: "none", borderRadius: 8,
                padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
              }}>View Recommendations →</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
