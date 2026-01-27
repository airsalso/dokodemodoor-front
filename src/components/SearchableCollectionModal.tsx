"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, SearchX } from "lucide-react";

interface CollectionItem {
  id: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  icon?: React.ReactNode;
}

interface SearchableCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: CollectionItem[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function SearchableCollectionModal({
  isOpen,
  onClose,
  title,
  description,
  items,
  selectedValue,
  onSelect,
  placeholder = "Search items...",
  emptyMessage = "No items found matching your search."
}: SearchableCollectionModalProps) {
  const [search, setSearch] = useState("");

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    (item.metadata && item.metadata.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl modal-container bg-[#f0f9ff] backdrop-blur-2xl border border-blue-200 shadow-[0_32px_120px_-20px_rgba(30,58,138,0.3)] flex flex-col h-full max-h-[85vh] overflow-hidden rounded-[3rem]"
          >
            {/* Red Top Border - Doraemon Collar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#ef4444] z-50" />

            {/* Header */}
            <div className="px-10 py-8 border-b border-blue-100 bg-white/60 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
                {description && <p className="text-[11px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-2 opacity-70">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="relative z-10 p-4 rounded-3xl hover:bg-rose-50 transition-all text-slate-300 hover:text-rose-500 border border-transparent hover:border-rose-100"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-10 py-6 bg-white/20 border-b border-blue-100 sticky top-0 z-10">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  autoFocus
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border-2 border-blue-100 rounded-[2rem] pl-16 pr-8 py-5 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-black placeholder:text-blue-200 shadow-sm text-lg"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-6 space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`w-full p-6 rounded-[2.5rem] text-left transition-all duration-300 flex items-center gap-6 group relative overflow-hidden ${
                      selectedValue === item.id
                        ? "bg-white border-4 border-blue-400 shadow-[0_15px_40px_-10px_rgba(59,130,246,0.2)] scale-[1.02]"
                        : "bg-white hover:bg-blue-50 border-4 border-transparent hover:border-blue-100 hover:shadow-lg"
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all duration-500 relative z-10 ${
                      selectedValue === item.id
                        ? "bg-blue-500 text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)]"
                        : "bg-blue-50 text-blue-400 group-hover:scale-110 group-hover:bg-blue-100 shadow-inner"
                    }`}>
                      {item.icon}
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-3">
                        <span className={`text-[19px] font-black tracking-tight transition-colors ${selectedValue === item.id ? "text-blue-600" : "text-slate-800"}`}>
                          {item.title}
                        </span>
                        {selectedValue === item.id && (
                          <div className="bg-blue-500 rounded-full p-1.5 shadow-lg">
                            <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
                          </div>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className={`text-sm font-bold truncate mt-1 transition-colors ${selectedValue === item.id ? "text-blue-400" : "text-slate-400"}`}>
                          {item.subtitle}
                        </p>
                      )}
                      {item.metadata && (
                        <p className={`text-[11px] font-black uppercase tracking-widest font-mono truncate mt-3 px-3 py-1 rounded-full w-fit ${selectedValue === item.id ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"}`}>
                          {item.metadata}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="p-8 rounded-full bg-blue-50 mb-6">
                    <SearchX className="w-16 h-16 text-blue-200" />
                  </div>
                  <p className="text-blue-300 font-black uppercase tracking-[0.4em] text-sm">{emptyMessage}</p>
                </div>
              )}
            </div>

            {/* Footer Summary - Yellow/Amber Theme */}
            <div className="px-12 py-7 bg-[#ffcc00] border-t-4 border-amber-300 flex justify-between items-center relative overflow-hidden">
              {/* Pattern for footer */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                   style={{ backgroundImage: `radial-gradient(circle at 1.5px 1.5px, black 1.5px, transparent 0)`, backgroundSize: '15px 15px' }} />

              <span className="relative z-10 text-xs text-amber-950 uppercase font-black tracking-[0.3em] flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-950/40" />
                {filteredItems.length} {filteredItems.length === 1 ? 'Record' : 'Records'} Found
              </span>
              <button
                onClick={onClose}
                className="relative z-10 px-10 py-4 rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.2em] text-amber-950 bg-white/40 hover:bg-white/60 transition-all border-2 border-amber-950/10 shadow-xl active:scale-95"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
