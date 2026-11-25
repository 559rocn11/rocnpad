import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  Key,
  Layers,
  Sparkles,
  Download,
  Book,
  FileText,
  Twitter,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { ReadwiseBook, NoteObject, UserSettings } from '../types';
import { readwiseService, SAMPLE_READWISE_BOOKS } from '../services/readwiseService';

interface ReadwiseSyncModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onImportNotes: (newNotes: NoteObject[]) => void;
}

export const ReadwiseSyncModal: React.FC<ReadwiseSyncModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onImportNotes,
}) => {
  if (!isOpen) return null;

  const [tokenInput, setTokenInput] = useState(settings.readwiseToken || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
  } | null>(null);

  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [books, setBooks] = useState<ReadwiseBook[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Load books on open if token exists or initialize with sample books
  useEffect(() => {
    if (settings.readwiseToken) {
      handleFetchBooks(settings.readwiseToken);
    } else {
      setBooks(SAMPLE_READWISE_BOOKS);
      setSelectedBookIds(new Set(SAMPLE_READWISE_BOOKS.map((b) => String(b.id))));
    }
  }, [settings.readwiseToken]);

  const handleValidateToken = async () => {
    if (!tokenInput.trim()) {
      setValidationStatus({
        tested: true,
        valid: false,
        message: 'Please enter your Readwise access token.',
      });
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    const result = await readwiseService.validateToken(tokenInput.trim());
    setIsValidating(false);
    setValidationStatus({
      tested: true,
      valid: result.valid,
      message: result.message,
    });

    if (result.valid) {
      onUpdateSettings({
        ...settings,
        readwiseToken: tokenInput.trim(),
      });
      handleFetchBooks(tokenInput.trim());
    }
  };

  const handleFetchBooks = async (token: string) => {
    setIsLoadingBooks(true);
    try {
      const fetched = await readwiseService.fetchExport(token);
      setBooks(fetched);
      setSelectedBookIds(new Set(fetched.map((b) => String(b.id))));
    } catch (e) {
      console.warn('Failed to fetch Readwise items, using samples:', e);
      setBooks(SAMPLE_READWISE_BOOKS);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const toggleBookSelection = (id: string) => {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = filteredBooks;
    const allSelected = filtered.every((b) => selectedBookIds.has(String(b.id)));
    if (allSelected) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(filtered.map((b) => String(b.id))));
    }
  };

  const handleImportSelected = () => {
    const toImport = books.filter((b) => selectedBookIds.has(String(b.id)));
    if (toImport.length === 0) return;

    const newNotes: NoteObject[] = toImport.map((book) =>
      readwiseService.transformBookToNote(book)
    );

    onImportNotes(newNotes);
    setImportSuccessCount(newNotes.length);

    setTimeout(() => {
      setImportSuccessCount(null);
      onClose();
    }, 1800);
  };

  const filteredBooks = books.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'articles':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'tweets':
        return <Twitter className="w-3.5 h-3.5 text-sky-400" />;
      case 'podcasts':
        return <Headphones className="w-3.5 h-3.5 text-purple-400" />;
      case 'books':
      default:
        return <Book className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0e1117] border border-[#222a3a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1c2230] bg-[#11151f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display tracking-tight">
                  READWISE SYNC ENGINE
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono-code">
                  v2 / Reader
                </span>
              </div>
              <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
                Import Kindle, iBooks, Twitter, Reader, and web highlights into ROCNpad
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#181e2b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Success Banner */}
          {importSuccessCount !== null && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold font-display">Sync Complete!</div>
                <div className="text-xs text-emerald-300/80">
                  Successfully imported {importSuccessCount} note{importSuccessCount === 1 ? '' : 's'} with full highlights to your vault.
                </div>
              </div>
            </div>
          )}

          {/* Token Configuration Section */}
          <div className="p-4 rounded-xl bg-[#131722] border border-[#21293b] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#e2e8f0] flex items-center gap-1.5 font-display">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Readwise Access Token</span>
              </label>

              <a
                href="https://readwise.io/access_token"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono-code"
              >
                <span>Get API Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste Readwise token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 bg-[#0a0c10] border border-[#202738] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#475569] font-mono-code focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleValidateToken}
                disabled={isValidating}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold font-mono-code flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                <span>{isValidating ? 'Checking...' : 'Connect'}</span>
              </button>
            </div>

            {/* Validation feedback */}
            {validationStatus && (
              <div
                className={`text-xs p-2.5 rounded-lg flex items-center gap-2 font-mono-code ${
                  validationStatus.valid
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {validationStatus.valid ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{validationStatus.message}</span>
              </div>
            )}
          </div>

          {/* Highlight & Book Ingest List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-display">
                  Available Books & Highlights ({filteredBooks.length})
                </span>
                {!settings.readwiseToken && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono-code">
                    Curated Sample Library
                  </span>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 text-[11px] font-mono-code">
                {(['all', 'books', 'articles', 'tweets'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                      selectedCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-[#64748b] hover:text-[#94a3b8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Books Card List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {isLoadingBooks ? (
                <div className="p-8 text-center text-xs font-mono-code text-[#64748b] space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                  <div>Querying Readwise API highlights...</div>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono-code text-[#64748b] border border-dashed border-[#222a3a] rounded-xl">
                  No highlights found for this filter.
                </div>
              ) : (
                filteredBooks.map((book) => {
                  const isSelected = selectedBookIds.has(String(book.id));
                  const highlightsCount = book.highlights?.length || book.num_highlights || 0;

                  return (
                    <div
                      key={String(book.id)}
                      onClick={() => toggleBookSelection(String(book.id))}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#141926] border-amber-500/50 shadow-sm'
                          : 'bg-[#0f121a] border-[#1f2535] hover:border-[#2d374d]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 accent-amber-500 rounded"
                      />

                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded-lg border border-[#222b3d] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-[#181d28] border border-[#242b3c] flex items-center justify-center shrink-0">
                          {getCategoryIcon(book.category)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white font-display truncate">
                            {book.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94a3b8] truncate">{book.author || 'Unknown Author'}</div>

                        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono-code text-[#64748b]">
                          <span className="flex items-center gap-1 text-amber-400">
                            {getCategoryIcon(book.category)}
                            <span className="capitalize">{book.category || 'Book'}</span>
                          </span>
                          <span>•</span>
                          <span>{highlightsCount} highlights</span>
                          {book.source && (
                            <>
                              <span>•</span>
                              <span>via {book.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1c2230] bg-[#11151f] flex items-center justify-between text-xs font-mono-code">
          <button
            onClick={toggleSelectAll}
            className="text-[#94a3b8] hover:text-white underline"
          >
            {filteredBooks.every((b) => selectedBookIds.has(String(b.id)))
              ? 'Deselect All'
              : 'Select All'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#191f2c]"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedBookIds.size === 0}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import Selected ({selectedBookIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
