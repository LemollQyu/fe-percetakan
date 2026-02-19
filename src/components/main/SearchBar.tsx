 "use client";

const SearchIcon = () => (
  <svg className="w-5 h-5 text-stone-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

/**
 * Ikon filter/sort: dua slider horizontal (garis pendek – lingkaran – garis pendek)
 * Satu SVG, dua baris, rapi dan proporsional.
 */
const FilterSortIcons = () => (
  <svg
    className="w-5 h-5 text-stone-500 shrink-0"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden
  >
    {/* Baris atas: segmen kiri – lingkaran – segmen kanan */}
    <line x1="2" y1="6" x2="6" y2="6" />
    <circle cx="10" cy="6" r="1.75" fill="currentColor" stroke="none" />
    <line x1="14" y1="6" x2="18" y2="6" />
    {/* Baris bawah */}
    <line x1="2" y1="14" x2="6" y2="14" />
    <circle cx="10" cy="14" r="1.75" fill="currentColor" stroke="none" />
    <line x1="14" y1="14" x2="18" y2="14" />
  </svg>
);

export function SearchBar() {
  return (
    <div className="w-full max-w-[430px] mx-auto px-4 py-3 border-b border-stone-200/60 bg-[#f5f0eb]/90">
      <div className="relative flex items-center h-11 px-4 rounded-full bg-white shadow-sm shadow-stone-200/50 border border-stone-100">
        <span className="flex items-center justify-center mr-3" aria-hidden>
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search......"
          className="flex-1 min-w-0 bg-transparent font-monterat-tipis text-sm text-stone-900 placeholder:text-stone-400 outline-none"
          aria-label="Cari"
        />
        <button
          type="button"
          className="flex items-center justify-center shrink-0 w-9 h-9 ml-1 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
          aria-label="Filter atau sortir"
        >
          <FilterSortIcons />
        </button>
      </div>
    </div>
  );
}

