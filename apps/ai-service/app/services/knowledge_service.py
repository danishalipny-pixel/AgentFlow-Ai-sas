import os
import re
import math
import json
from typing import List, Dict, Any, Optional
from collections import Counter
from app.core.config import settings

class LocalKnowledgeEngine:
    _index_file = os.path.join(settings.KNOWLEDGE_STORAGE_PATH, "knowledge_index.json")

    @classmethod
    def _ensure_storage(cls):
        os.makedirs(settings.KNOWLEDGE_STORAGE_PATH, exist_ok=True)
        if not os.path.exists(cls._index_file):
            with open(cls._index_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    @classmethod
    def extract_text(cls, file_path: str, filename: str) -> str:
        """Extracts plain text from TXT, MD, CSV, or PDF files locally."""
        ext = os.path.splitext(filename)[1].lower()

        if ext in [".txt", ".md", ".markdown", ".json"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        elif ext == ".csv":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                if not lines:
                    return ""
                header = lines[0].strip()
                content = [f"Table columns: {header}"]
                for i, line in enumerate(lines[1:50], 1):
                    content.append(f"Row {i}: {line.strip()}")
                return "\n".join(content)

        elif ext == ".pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                pages_text = []
                for idx, page in enumerate(reader.pages):
                    t = page.extract_text()
                    if t:
                        pages_text.append(f"--- Page {idx + 1} ---\n{t}")
                return "\n\n".join(pages_text)
            except Exception as e:
                return f"Error extracting PDF text: {str(e)}"

        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    @classmethod
    def chunk_text(cls, text: str, chunk_size: int = 600, overlap: int = 80) -> List[str]:
        """Splits long text into overlapping chunks respecting sentence boundaries."""
        paragraphs = re.split(r"\n\s*\n", text.strip())
        chunks: List[str] = []
        current_chunk = ""

        for para in paragraphs:
            para_clean = para.strip()
            if not para_clean:
                continue

            if len(current_chunk) + len(para_clean) < chunk_size:
                current_chunk += ("\n\n" + para_clean if current_chunk else para_clean)
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Keep overlap from previous chunk
                    current_chunk = current_chunk[-overlap:] + "\n" + para_clean
                else:
                    # Single paragraph exceeds chunk_size, split by sentences
                    sentences = re.split(r"(?<=[.!?])\s+", para_clean)
                    for sent in sentences:
                        if len(current_chunk) + len(sent) < chunk_size:
                            current_chunk += (" " + sent if current_chunk else sent)
                        else:
                            if current_chunk:
                                chunks.append(current_chunk)
                            current_chunk = sent

        if current_chunk:
            chunks.append(current_chunk)

        return chunks if chunks else [text[:chunk_size]]

    @classmethod
    def index_document(cls, organization_id: str, doc_id: str, title: str, text: str) -> int:
        """Chunks and indexes a document locally for an organization."""
        cls._ensure_storage()
        chunks = cls.chunk_text(text)

        new_entries = []
        for idx, chunk in enumerate(chunks):
            new_entries.append({
                "organization_id": organization_id,
                "document_id": doc_id,
                "title": title,
                "chunk_index": idx,
                "content": chunk,
            })

        try:
            with open(cls._index_file, "r", encoding="utf-8") as f:
                all_records = json.load(f)
        except Exception:
            all_records = []

        # Remove existing chunks for this doc_id if re-indexing
        all_records = [r for r in all_records if r.get("document_id") != doc_id]
        all_records.extend(new_entries)

        with open(cls._index_file, "w", encoding="utf-8") as f:
            json.dump(all_records, f, ensure_ascii=False, indent=2)

        return len(chunks)

    @classmethod
    def _tokenize(cls, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\b\w{2,}\b", text)]

    @classmethod
    def search(cls, organization_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Performs local TF-IDF semantic relevance ranking over stored document chunks."""
        cls._ensure_storage()
        try:
            with open(cls._index_file, "r", encoding="utf-8") as f:
                records = json.load(f)
        except Exception:
            return []

        # Filter by organization for strict tenant isolation
        org_records = [r for r in records if r.get("organization_id") == organization_id]
        if not org_records:
            return []

        query_tokens = cls._tokenize(query)
        if not query_tokens:
            return org_records[:top_k]

        # Compute document frequencies
        doc_count = len(org_records)
        df: Counter = Counter()
        for r in org_records:
            unique_words = set(cls._tokenize(r["content"]))
            for w in unique_words:
                df[w] += 1

        # Score each chunk using TF-IDF cosine similarity with add-1 smoothing
        query_tf = Counter(query_tokens)
        query_vec = {w: tf * (1.0 + math.log((doc_count + 1) / (df.get(w, 0) + 1))) for w, tf in query_tf.items()}
        query_mag = math.sqrt(sum(v ** 2 for v in query_vec.values())) or 1.0

        scored = []
        for r in org_records:
            chunk_tokens = cls._tokenize(r["content"])
            chunk_tf = Counter(chunk_tokens)
            dot_product = 0.0
            chunk_mag_sq = 0.0

            for w, tf in chunk_tf.items():
                idf = 1.0 + math.log((doc_count + 1) / (df.get(w, 0) + 1))
                weight = tf * idf
                chunk_mag_sq += weight ** 2
                if w in query_vec:
                    dot_product += query_vec[w] * weight

            chunk_mag = math.sqrt(chunk_mag_sq) or 1.0
            similarity = dot_product / (query_mag * chunk_mag)

            if similarity > 0.05:
                scored.append({
                    "title": r.get("title", "Document"),
                    "content": r.get("content", ""),
                    "score": round(similarity, 4),
                    "document_id": r.get("document_id"),
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    @classmethod
    def format_context_block(cls, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return ""
        blocks = []
        for c in chunks:
            blocks.append(f"Source [{c['title']}]:\n{c['content']}")
        return "\n\n---\n".join(blocks)
