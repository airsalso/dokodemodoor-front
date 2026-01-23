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
            className="relative w-full max-w-2xl bg-[#0f111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">{title}</h2>
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-white/5 border-b border-white/5 sticky top-0 z-10">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  autoFocus
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 group ${
                      selectedValue === item.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedValue === item.id ? "bg-primary text-white" : "bg-white/5 text-gray-400 group-hover:text-white"
                    }`}>
                      {item.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold truncate ${selectedValue === item.id ? "text-primary" : "text-white"}`}>
                          {item.title}
                        </span>
                        {selectedValue === item.id && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                      {item.metadata && (
                        <p className="text-[10px] text-gray-600 font-mono truncate mt-1 italic">{item.metadata}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                  <SearchX className="w-12 h-12 mb-4 text-gray-600" />
                  <p className="text-gray-500 font-medium">{emptyMessage}</p>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center px-6">
              <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest leading-none">
                {filteredItems.length} items found
              </span>
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
