import re
from typing import Dict, Any, List
from backend.services.file_service import extract_file_content

def chunk_document_text(text: str, chunk_size: int = 500) -> List[Dict[str, Any]]:
    """
    Splits document text into indexed chunks with paragraph/page numbers for RAG lookup.
    """
    paragraphs = text.split("\n\n")
    chunks = []
    chunk_id = 1
    
    current_chunk = ""
    current_page = 1

    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue

        # Check for page markers
        page_match = re.search(r"--- Page (\d+) ---", p_clean)
        if page_match:
            current_page = int(page_match.group(1))

        if len(current_chunk) + len(p_clean) > chunk_size:
            if current_chunk:
                chunks.append({
                    "chunk_id": chunk_id,
                    "page": current_page,
                    "text": current_chunk.strip()
                })
                chunk_id += 1
            current_chunk = p_clean
        else:
            current_chunk += "\n" + p_clean if current_chunk else p_clean

    if current_chunk:
        chunks.append({
            "chunk_id": chunk_id,
            "page": current_page,
            "text": current_chunk.strip()
        })

    return chunks

def retrieve_rag_context(document_text: str, query: str, top_k: int = 3) -> Dict[str, Any]:
    """
    RAG Engine: Indexes document text, ranks chunks by relevance to query keywords, and returns exact context chunks.
    """
    chunks = chunk_document_text(document_text)
    if not chunks:
        return {"context_text": document_text[:1000], "citations": []}

    query_terms = set(re.findall(r"\w+", query.lower()))
    scored_chunks = []

    for c in chunks:
        chunk_words = set(re.findall(r"\w+", c["text"].lower()))
        overlap = len(query_terms.intersection(chunk_words))
        
        # Boost exact phrase matches
        if query.lower() in c["text"].lower():
            overlap += 5

        scored_chunks.append((overlap, c))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    best_chunks = [c for score, c in scored_chunks[:top_k] if score > 0]

    if not best_chunks:
        best_chunks = [chunks[0]]

    combined_context = "\n\n".join([f"[Page {c['page']}] {c['text']}" for c in best_chunks])
    citations = [{"page": c["page"], "chunk_id": c["chunk_id"]} for c in best_chunks]

    return {
        "context_text": combined_context,
        "citations": citations
    }
