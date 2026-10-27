import { useMemo, useState } from "react";

type ResearchItem = {
  id: number;
  title: string;
  type: string;
  date: string;
  authors: string;
  description: string;
  image?: string;
  pdfUrl?: string;
  onlineUrl?: string;
};

const researchItems: ResearchItem[] = [
  {
    id: 1,
    title: "The Impact of Nearshoring on Southeast Asian Supply Chains",
    type: "Working Paper",
    date: "October 2024",
    authors: "Dr. Elena Rostova & James H. Miller",
    description:
      "An analysis of how nearshoring is reshaping regional production networks, trade flows, and supply-chain resilience across Southeast Asia.",
    image:
      "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Financing the Green Transition: Public-Private Partnerships",
    type: "Policy Brief",
    date: "September 2024",
    authors: "Sarah Jenkins",
    description:
      "This policy brief explores practical financing models and public-private partnerships that can help accelerate a fair and sustainable green transition.",
    image:
      "https://images.unsplash.com/photo-1473341304170-971afb6b5b74?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Quarterly Macroeconomic Outlook: Q3 2024",
    type: "Report",
    date: "August 2024",
    authors: "EPL Research Group",
    description:
      "An overview of recent macroeconomic developments, key risks, and policy considerations shaping the third quarter of 2024.",
  },
];

const filters = ["All Research", "Working Paper", "Policy Brief", "Report"];
const PAGE_SIZE = 3;

export default function Research() {
  const [filter, setFilter] = useState("All Research");
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(
    () =>
      filter === "All Research"
        ? researchItems
        : researchItems.filter((item) => item.type === filter),
    [filter]
  );

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function changeFilter(value: string) {
    setFilter(value);
    setPage(1);
  }

  return (
    <main className="research-page">
      <section className="research-intro">
        <p className="eyebrow">Economic Policy Lab</p>
        <h1>Research Archive</h1>
        <p className="research-description">
          Exploring economic challenges through rigorous research and
          evidence-based policy analysis.
        </p>
      </section>

      <div className="research-toolbar">
        <div className="research-filters" aria-label="Filter research">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "research-filter selected" : "research-filter"}
              aria-pressed={filter === item}
              onClick={() => changeFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="research-count">
          {filteredItems.length} {filteredItems.length === 1 ? "publication" : "publications"}
        </p>
      </div>

      {visibleItems.length > 0 ? (
        <section className="research-list" aria-label="Research publications">
          {visibleItems.map((item) => (
            <article className="research-card" key={item.id}>
              {item.image && (
                <img
                  className="research-cover"
                  src={item.image}
                  alt=""
                  loading="lazy"
                />
              )}

              <div className="research-card-body">
                <div className="research-meta">
                  <span>{item.type}</span>
                  <span>{item.date}</span>
                </div>
                <h2>{item.title}</h2>
                <p className="research-authors">{item.authors}</p>
                <p className="research-summary">{item.description}</p>
                <div className="research-actions">
                  {item.pdfUrl ? (
                    <a className="research-button research-button-dark" href={item.pdfUrl} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  ) : (
                    <span className="research-button research-button-dark research-button-disabled" aria-disabled="true">
                      PDF coming soon
                    </span>
                  )}
                  {item.onlineUrl ? (
                    <a className="research-button research-button-outline" href={item.onlineUrl} target="_blank" rel="noreferrer">
                      Read Online
                    </a>
                  ) : (
                    <span className="research-button research-button-outline research-button-disabled" aria-disabled="true">
                      Read Online
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className="status-message">No research publications found in this category.</p>
      )}

      {pageCount > 1 && (
        <nav className="research-pagination" aria-label="Research pages">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
            Previous
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              className={page === number ? "current" : ""}
              aria-current={page === number ? "page" : undefined}
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          ))}
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
