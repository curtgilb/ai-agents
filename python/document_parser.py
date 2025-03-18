import os
from typing import List, Tuple
from database import db
from qdrant_client.models import Distance, VectorParams, PointStruct
from chunker import chunk_file, chunk_by_size, Chunk
from embedder import embedder
import tiktoken


def _get_file_paths(directory: str) -> List[Tuple[str, str]]:
    markdown_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                markdown_files.append((root, file))
    return markdown_files


def _read_file(directory: str, file_name: str) -> str:
    file_path = os.path.join(directory, file_name)
    with open(file_path, 'r') as f:
        return f.read()


def _encode_chunks(chunks: List[Chunk]):
    texts = []
    for chunk in chunks:
        # Include header in the text to be embedded for better context
        text = f"{chunk.header}\n\n{chunk.content}"
        texts.append(text)

    # Generate embeddings
    embeddings = embedder.encode(texts)

    # Add embeddings to chunks
    for i, chunk in enumerate(chunks):
        chunk.embedding = embeddings[i]

    return chunks


def _save_embeddings(collection_name: str, chunks: List[Chunk]):
    enc = tiktoken.encoding_for_model("gpt-4o-mini")
    points = [PointStruct(id=idx+1, vector=chunk.embedding,
                          payload={"header": chunk.header,
                                   "content": chunk.content,
                                   "path": chunk.path,
                                   "is_partial": chunk.is_partial,
                                   "header_path": chunk.header_path,
                                   "token_count": len(enc.encode(chunk.content))
                                   }) for idx, chunk in enumerate(chunks)]

    _upsert_collection(collection_name)

    db.upsert(
        collection_name=collection_name,
        wait=True,
        points=points,
    )


def _upsert_collection(collection_name: str):
    if not db.collection_exists(collection_name):
        db.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def ingest_documents(directory: str, collection_name: str, min_chunk_size=200, max_chunk_size=800):
    markdown_files = _get_file_paths(directory)
    all_embeddings = []
    for path, file in markdown_files:
        content = _read_file(path, file)
        header_chunks = chunk_file(content, file)
        final_chunks = chunk_by_size(
            header_chunks, min_chunk_size, max_chunk_size)
        all_embeddings.extend(_encode_chunks(final_chunks))
    _save_embeddings(collection_name, all_embeddings)
