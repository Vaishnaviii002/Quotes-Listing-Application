import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://api.freeapi.app/api/v1/public/quotes";
const QUOTES_PER_PAGE = 12;

function App() {
  const [quotes, setQuotes] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorite-quotes")) || [];
    } catch {
      return [];
    }
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuotes, setTotalQuotes] = useState(0);

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showFavorites, setShowFavorites] = useState(false);

  const [featuredQuote, setFeaturedQuote] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchQuotes();
  }, [page]);

  useEffect(() => {
    localStorage.setItem("favorite-quotes", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast]);

  async function fetchQuotes() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}?page=${page}&limit=${QUOTES_PER_PAGE}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch quotes.");
      }

      const result = await response.json();
      const quoteData = result?.data?.data || [];

      setQuotes(quoteData);
      setTotalPages(result?.data?.totalPages || 1);
      setTotalQuotes(result?.data?.totalItems || quoteData.length);

      if (quoteData.length > 0) {
        setFeaturedQuote(quoteData[0]);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError("Quotes could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const displayedSource = showFavorites ? favorites : quotes;

  const availableTags = useMemo(() => {
    const tags = displayedSource.flatMap((quote) => quote.tags || []);
    return ["All", ...new Set(tags)];
  }, [displayedSource]);

  const filteredQuotes = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    const filtered = displayedSource.filter((quote) => {
      const content = quote.content?.toLowerCase() || "";
      const author = quote.author?.toLowerCase() || "";

      const matchesSearch =
        content.includes(searchValue) || author.includes(searchValue);

      const matchesTag =
        selectedTag === "All" ||
        quote.tags?.some((tag) => tag === selectedTag);

      return matchesSearch && matchesTag;
    });

    return [...filtered].sort((firstQuote, secondQuote) => {
      if (sortBy === "author") {
        return firstQuote.author.localeCompare(secondQuote.author);
      }

      if (sortBy === "shortest") {
        return firstQuote.content.length - secondQuote.content.length;
      }

      if (sortBy === "longest") {
        return secondQuote.content.length - firstQuote.content.length;
      }

      return 0;
    });
  }, [displayedSource, search, selectedTag, sortBy]);

  function getQuoteId(quote) {
    return quote.id || quote._id;
  }

  function isFavorite(quote) {
    return favorites.some(
      (favoriteQuote) => getQuoteId(favoriteQuote) === getQuoteId(quote)
    );
  }

  function toggleFavorite(quote) {
    if (isFavorite(quote)) {
      setFavorites((currentFavorites) =>
        currentFavorites.filter(
          (favoriteQuote) =>
            getQuoteId(favoriteQuote) !== getQuoteId(quote)
        )
      );

      setToast("Removed from favorites");
    } else {
      setFavorites((currentFavorites) => [...currentFavorites, quote]);
      setToast("Added to favorites");
    }
  }

  function generateRandomQuote() {
    if (quotes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * quotes.length);
    setFeaturedQuote(quotes[randomIndex]);
  }

  async function copyQuote(quote) {
    const quoteText = `“${quote.content}” — ${quote.author}`;

    try {
      await navigator.clipboard.writeText(quoteText);
      setToast("Quote copied");
    } catch {
      setToast("Unable to copy quote");
    }
  }

  async function shareQuote(quote) {
    const quoteText = `“${quote.content}” — ${quote.author}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Quote Gallery",
          text: quoteText,
        });
      } catch (shareError) {
        if (shareError.name !== "AbortError") {
          setToast("Unable to share quote");
        }
      }
    } else {
      copyQuote(quote);
    }
  }

  function changePage(newPage) {
    setPage(newPage);
    setSearch("");
    setSelectedTag("All");

    window.scrollTo({
      top: 500,
      behavior: "smooth",
    });
  }

  function changeView(favoritesView) {
    setShowFavorites(favoritesView);
    setSearch("");
    setSelectedTag("All");
    setSortBy("default");
  }

  return (
    <div className="app">
      <header className="navbar">
        <button
          className="logo"
          onClick={() => changeView(false)}
          aria-label="Go to quote gallery"
        >
          <span className="logo-symbol">Q</span>
          <span>Quotely</span>
        </button>

        <nav className="navigation">
          <button
            className={!showFavorites ? "nav-button active" : "nav-button"}
            onClick={() => changeView(false)}
          >
            Explore
          </button>

          <button
            className={showFavorites ? "nav-button active" : "nav-button"}
            onClick={() => changeView(true)}
          >
            Favorites
            <span className="favorite-count">{favorites.length}</span>
          </button>
        </nav>

        <button
          className="theme-button"
          onClick={() => setDarkMode((currentMode) => !currentMode)}
          aria-label="Change website theme"
        >
          {darkMode ? "☀" : "☾"}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">WORDS WORTH REMEMBERING</p>

            <h1>
              Find words that
              <span> stay with you.</span>
            </h1>

            <p className="hero-description">
              Browse meaningful thoughts from writers, leaders and thinkers.
              Save your favorites and return whenever you need inspiration.
            </p>

            <div className="hero-statistics">
              <div>
                <strong>{totalQuotes || "300+"}</strong>
                <span>Total quotes</span>
              </div>

              <div>
                <strong>{favorites.length}</strong>
                <span>Saved quotes</span>
              </div>

              <div>
                <strong>{totalPages}</strong>
                <span>Collections</span>
              </div>
            </div>
          </div>

          <div className="featured-card">
            <div className="featured-header">
              <span>QUOTE OF THE MOMENT</span>

              <button onClick={generateRandomQuote}>
                <span>↻</span>
                New quote
              </button>
            </div>

            {featuredQuote ? (
              <>
                <div className="large-quote-mark">“</div>

                <blockquote>{featuredQuote.content}</blockquote>

                <div className="featured-footer">
                  <div className="featured-author">
                    <span className="author-avatar">
                      {featuredQuote.author?.charAt(0)}
                    </span>

                    <div>
                      <strong>{featuredQuote.author}</strong>
                      <small>
                        {featuredQuote.tags?.[0] || "Inspirational thought"}
                      </small>
                    </div>
                  </div>

                  <button
                    className={
                      isFavorite(featuredQuote)
                        ? "heart-button selected"
                        : "heart-button"
                    }
                    onClick={() => toggleFavorite(featuredQuote)}
                    aria-label="Save featured quote"
                  >
                    {isFavorite(featuredQuote) ? "♥" : "♡"}
                  </button>
                </div>
              </>
            ) : (
              <p className="featured-message">Loading featured quote...</p>
            )}
          </div>
        </section>

        <section className="gallery-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">
                {showFavorites ? "YOUR COLLECTION" : "EXPLORE AND DISCOVER"}
              </p>

              <h2>
                {showFavorites ? "Favorite quotes" : "Quote gallery"}
              </h2>
            </div>

            <p>
              {showFavorites
                ? `${favorites.length} saved quote${
                    favorites.length === 1 ? "" : "s"
                  }`
                : `Page ${page} of ${totalPages}`}
            </p>
          </div>

          <div className="filters">
            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search quotes or authors..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
            >
              {availableTags.map((tag) => (
                <option value={tag} key={tag}>
                  {tag === "All" ? "All topics" : tag}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="default">Featured</option>
              <option value="author">Author A-Z</option>
              <option value="shortest">Shortest first</option>
              <option value="longest">Longest first</option>
            </select>
          </div>

          {loading && !showFavorites && (
            <div className="quote-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="quote-card skeleton-card" key={index}>
                  <div className="skeleton skeleton-small"></div>
                  <div className="skeleton skeleton-large"></div>
                  <div className="skeleton skeleton-medium"></div>
                  <div className="skeleton skeleton-footer"></div>
                </div>
              ))}
            </div>
          )}

          {error && !showFavorites && !loading && (
            <div className="message-card">
              <span>!</span>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button onClick={fetchQuotes}>Try again</button>
            </div>
          )}

          {!loading && !error && filteredQuotes.length > 0 && (
            <div className="quote-grid">
              {filteredQuotes.map((quote, index) => (
                <article className="quote-card" key={getQuoteId(quote)}>
                  <span className="card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="quote-mark">“</div>

                  <blockquote>{quote.content}</blockquote>

                  <div className="tag-list">
                    {(quote.tags || []).slice(0, 2).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <footer className="quote-footer">
                    <div className="author">
                      <span className="author-avatar">
                        {quote.author?.charAt(0)}
                      </span>

                      <div>
                        <strong>{quote.author || "Unknown author"}</strong>
                        <small>{quote.content.length} characters</small>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => copyQuote(quote)}
                        title="Copy quote"
                      >
                        ⧉
                      </button>

                      <button
                        onClick={() => shareQuote(quote)}
                        title="Share quote"
                      >
                        ↗
                      </button>

                      <button
                        className={isFavorite(quote) ? "selected" : ""}
                        onClick={() => toggleFavorite(quote)}
                        title="Save quote"
                      >
                        {isFavorite(quote) ? "♥" : "♡"}
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filteredQuotes.length === 0 && (
            <div className="message-card">
              <span>“</span>

              <h3>
                {showFavorites && favorites.length === 0
                  ? "No favorite quotes yet"
                  : "No quotes found"}
              </h3>

              <p>
                {showFavorites && favorites.length === 0
                  ? "Click the heart icon on any quote to save it here."
                  : "Try changing your search or selected topic."}
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setSelectedTag("All");

                  if (showFavorites && favorites.length === 0) {
                    changeView(false);
                  }
                }}
              >
                {showFavorites && favorites.length === 0
                  ? "Explore quotes"
                  : "Clear filters"}
              </button>
            </div>
          )}

          {!showFavorites &&
            !loading &&
            !error &&
            filteredQuotes.length > 0 && (
              <div className="pagination">
                <button
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                >
                  ← Previous
                </button>

                <span>
                  Page <strong>{page}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>

                <button
                  onClick={() => changePage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
        </section>
      </main>

      <footer className="website-footer">
        <div className="logo">
          <span className="logo-symbol">Q</span>
          <span>Quotely</span>
        </div>

        <p>Small words. Lasting impact.</p>

        <a
          href="https://freeapi.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by FreeAPI ↗
        </a>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;