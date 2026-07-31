const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      placeholder={placeholder}
    />
  </div>
);

export default SearchBox;
