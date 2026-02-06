"use client";

import React, { useState, type HTMLAttributes, isValidElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Loader2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
}

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & { node?: unknown };

const CodeBlock = ({ children, node, ...props }: CodeBlockProps) => {
  void node;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Extract text from children (ReactMarkdown structure)
    const childrenArray = React.Children.toArray(children);
    const codeElement = childrenArray[0];

    const textToCopy = isValidElement(codeElement)
      ? String((codeElement.props as { children?: React.ReactNode }).children || "")
      : String(codeElement || "");

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group cursor-copy active:scale-[0.99] transition-transform" onClick={handleCopy}>
      <pre className="!m-0" {...props}>{children}</pre>
      <div className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all duration-300 pointer-events-none ${
        copied
          ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110'
          : 'bg-white/5 text-white/30 group-hover:text-white/80 group-hover:bg-white/10'
      }`}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </div>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute top-5 right-16 px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg pointer-events-none shadow-lg"
          >
            Copied
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DocumentationModal = ({
  isOpen,
  onClose,
  title,
  content,
  isLoading,
}: DocumentationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/20 backdrop-blur-md"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-5xl h-[90vh] bg-white rounded-[2.5rem] overflow-hidden flex flex-col border border-blue-100 shadow-[0_20px_70px_rgba(0,102,255,0.15)] relative"
          >
            {/* Premium Light Header - Doraemon Blue Gradient */}
            <div className="p-10 flex items-center justify-between bg-gradient-to-r from-[#009dff] to-[#0072ff] relative">
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight uppercase">
                    {title}
                  </div>
                  <div className="text-[9px] text-white/80 font-black uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Official Documentation
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90 active:scale-95 border border-white/20"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Area - Clean White with Blue Accents */}
            <div className="flex-1 overflow-y-auto p-8 md:p-14 bg-white custom-light-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0072ff]" />
                    <div className="absolute inset-0 blur-xl bg-blue-400/20 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black text-[#0072ff] uppercase tracking-[0.3em]">Optimizing Resource</p>
                </div>
              ) : (
                <div className="markdown-light-container">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: (props) => <CodeBlock {...props} />
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-blue-50 bg-blue-50/30 flex justify-between items-center px-10">
              <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Doraemon Standard v2.1</span>
              <button
                onClick={onClose}
                className="px-10 py-3.5 bg-gradient-to-r from-[#009dff] to-[#0072ff] hover:from-[#0072ff] hover:to-[#005cff] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Close
              </button>
            </div>

            <style jsx global>{`
              .markdown-light-container {
                color: #374151 !important;
                line-height: 1.7 !important;
                font-size: 1rem !important;
                font-family: inherit;
              }
              .markdown-light-container h1 {
                font-size: 2.25rem !important;
                font-weight: 900 !important;
                color: #0072ff !important;
                margin-top: 0 !important;
                margin-bottom: 1.75rem !important;
                letter-spacing: -0.04em !important;
                line-height: 1.2 !important;
                border-bottom: 3px solid #f0f7ff !important;
                padding-bottom: 1rem !important;
              }
              .markdown-light-container h2 {
                font-size: 1.5rem !important;
                font-weight: 800 !important;
                color: #111827 !important;
                margin-top: 3rem !important;
                margin-bottom: 1.25rem !important;
                display: flex !important;
                align-items: center !important;
                gap: 0.75rem !important;
              }
              .markdown-light-container h2::before {
                content: '' !important;
                width: 8px !important;
                height: 8px !important;
                background: #0072ff !important;
                border-radius: 50% !important;
                display: inline-block !important;
                box-shadow: 0 0 0 4px #e6f1ff !important;
              }
              .markdown-light-container h3 {
                font-size: 1.15rem !important;
                font-weight: 700 !important;
                color: #0072ff !important;
                margin-top: 2.25rem !important;
                margin-bottom: 0.75rem !important;
              }
              .markdown-light-container p {
                margin-bottom: 1.5rem !important;
                opacity: 0.9 !important;
              }
              .markdown-light-container strong {
                color: #0072ff !important;
                font-weight: 800 !important;
                background: #f0f7ff !important;
                padding: 0 4px !important;
                border-radius: 4px !important;
              }
              .markdown-light-container code {
                font-family: inherit !important;
                background: #f1f5f9 !important;
                color: #0072ff !important;
                padding: 0.2rem 0.4rem !important;
                border-radius: 6px !important;
                font-size: 0.85em !important;
                border: 1px solid #e2e8f0 !important;
                font-weight: 700 !important;
              }
              .markdown-light-container pre {
                background: #0f172a !important;
                border-radius: 1rem !important;
                padding: 1.75rem !important;
                margin: 2.5rem 0 !important;
                overflow-x: auto !important;
              }
              .markdown-light-container pre code {
                background: transparent !important;
                color: #93c5fd !important;
                border: none !important;
                padding: 0 !important;
                line-height: 1.6 !important;
                font-size: 0.9em !important;
                font-family: monospace !important;
              }
              .markdown-light-container ul {
                list-style-type: none !important;
                margin-bottom: 2rem !important;
                padding-left: 0.5rem !important;
              }
              .markdown-light-container li {
                margin-bottom: 1rem !important;
                position: relative !important;
                padding-left: 1.5rem !important;
              }
              .markdown-light-container ul li::before {
                content: "✓" !important;
                position: absolute !important;
                left: 0 !important;
                color: #0072ff !important;
                font-weight: 900 !important;
                font-size: 0.9em !important;
              }
              .markdown-light-container blockquote {
                background: #f0f9ff !important;
                border-left: 4px solid #0072ff !important;
                padding: 1.75rem 2rem !important;
                margin: 3rem 0 !important;
                border-radius: 0 1.25rem 1.25rem 0 !important;
                font-style: italic !important;
                color: #0369a1 !important;
                font-size: 1.1rem !important;
              }
              .custom-light-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-light-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 20px;
              }
              .custom-light-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1;
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
