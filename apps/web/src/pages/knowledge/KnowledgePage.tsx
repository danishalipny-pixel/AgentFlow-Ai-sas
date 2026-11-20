import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  Search,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { success, error } = useToast();

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/knowledge');
      if (res.data?.success) {
        setDocuments(res.data.data || []);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch knowledge documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await api.get(`/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.data?.success) {
        setSearchResults(res.data.data || []);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Search failed');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      error('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());

      const res = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        success(`Document '${res.data.data.title}' uploaded and indexed into knowledge base!`);
        setIsUploadModalOpen(false);
        setTitle('');
        setFile(null);
        fetchDocuments();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Document upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!window.confirm(`Delete document '${docTitle}' from workspace knowledge?`)) return;

    try {
      await api.delete(`/knowledge/${docId}`);
      success(`Document '${docTitle}' removed`);
      fetchDocuments();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Knowledge Base</h1>
          <p className="text-xs text-gray-400 mt-1">
            Upload organizational documents, specifications, and policies to ground AI agent responses.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          leftIcon={<Upload className="w-4 h-4" />}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="glass-panel p-3 rounded-xl border border-white/5 flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search indexed knowledge documents for keywords or concepts..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) setSearchResults(null);
            }}
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search Knowledge
        </Button>
      </form>

      {/* Search Results Preview */}
      {searchResults !== null && (
        <div className="p-4 rounded-xl glass-panel border border-gold/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
              Search Matches for "{searchQuery}" ({searchResults.length} Found)
            </h3>
            <button
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
              className="text-[11px] text-gray-400 hover:text-white"
            >
              Clear Results
            </button>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-xs text-gray-400">No matching sections found.</p>
          ) : (
            searchResults.map((r, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-surface-card border border-white/5 space-y-1">
                <span className="text-xs font-bold text-white">{r.title}</span>
                <p className="text-xs text-gray-300 font-mono leading-relaxed bg-black/40 p-2 rounded">
                  {r.snippet}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-gold" />}
          title="No Knowledge Documents Uploaded"
          description="Upload internal FAQs, pricing sheets, technical architecture, or sales manuals to ground your workforce."
          actionLabel="Upload First Document"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <Card key={doc.id} hoverEffect className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant="emerald" size="sm">
                    {doc.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-white truncate mb-1">{doc.title}</h3>
                <p className="text-xs text-gray-400 truncate mb-4">{doc.fileName}</p>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                  <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{doc.chunkCount} chunks</span>
                  <span>•</span>
                  <span className="uppercase">{doc.fileType}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-4">
                <span className="text-[10px] text-gray-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Knowledge Document"
        description="Supported formats: .txt, .md, .csv, .json (up to 15MB)."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Document Title (Optional)"
            placeholder="e.g. Enterprise Security Architecture Standard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Select File</label>
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-black hover:file:bg-gold-light file:cursor-pointer cursor-pointer border border-surface-border rounded-lg p-2 bg-surface-card"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isUploading}>
              Upload & Index
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
