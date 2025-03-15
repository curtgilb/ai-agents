import os
import re
from typing import List, Tuple
from dataclasses import dataclass
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from Chunker import chunk_file, chunk_by_size, Chunk


def get_file_paths(directory: str) -> List[Tuple[str, str]]:
    markdown_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                markdown_files.append((root, file))
    return markdown_files


def read_file(directory: str, file_name: str) -> str:
    file_path = os.path.join(directory, file_name)
    with open(file_path, 'r') as f:
        return f.read()


def create_embeddings(chunks: List[Chunk]):
    texts = []
    for chunk in chunks:
        # Include header in the text to be embedded for better context
        text = f"{chunk.header}\n\n{chunk.content}"
        texts.append(text)

    # Generate embeddings
    embeddings = model.encode(texts)

    # Add embeddings to chunks
    for i, chunk in enumerate(chunks):
        chunk.embedding = embeddings[i]

    return chunks


def save_embeddings(chunks: List[Chunk]):
    points = [PointStruct(id=idx+1, vector=chunk.embedding,
                          payload={"header": chunk.header,
                                   "content": chunk.content,
                                   "path": chunk.path,
                                   "is_partial": chunk.is_partial,
                                   "header_path": chunk.header_path}) for idx, chunk in enumerate(chunks)]

    client.upsert(
        collection_name="test_collection",
        wait=True,
        points=points,
    )


min_chunk_size = 200
max_chunk_size = 800
model = SentenceTransformer('all-MiniLM-L6-v2')

client = QdrantClient(url="http://qdrant:6333")

client.create_collection(
    collection_name="test_collection",
    vectors_config=VectorParams(size=384, distance=Distance.DOT),
)


directory = "./docs"
markdown_files = get_file_paths(directory)
all_embeddings = []
for path, file in markdown_files:
    content = read_file(path, file)
    header_chunks = chunk_file(content, file)
    final_chunks = chunk_by_size(header_chunks, min_chunk_size, max_chunk_size)
    all_embeddings.extend(create_embeddings(final_chunks))
save_embeddings(all_embeddings)


# @dataclass
# class Chunk:
#     header: str
#     content: str
#     path: str
#     is_partial: bool = False
#     embedding: str = None

# def chunk_file(content: str, file_path: str) -> List[Chunk]:
#     # Split by headers
#     header_pattern = r'^#{1,6}\s+.+$'
#     sections = []
#     current_section = []
#     current_header = "Introduction"

#     for line in content.split('\n'):
#         # All heading elements
#         if re.match(header_pattern, line, re.MULTILINE):
#             # Save previous section if it exists
#             if current_section:
#                 sections.append(
#                     Chunk(
#                         header=current_header,
#                         content='\n'.join(current_section),
#                         path=os.path.basename(file_path)
#                     )
#                 )
#             # Reset for a new heading
#             current_header = line.strip('# ')
#             current_section = []
#         else:
#             current_section.append(line)
#     return sections


# def chunk_sections(sections: List[Chunk]):
#     section_chunks = []

#     for section in sections:
#         content = section['content']
#         # If section is small enough, keep as is
#         if len(content.split()) < max_chunk_size:
#             section_chunks.append(section)
#         else:
#             section_chunks.extend(chunk_paragraphs(section))

#     return section_chunks


# def chunk_paragraphs(section: Chunk) -> List[Chunk]:
#     paragraph_chunks = []

#     # Split by paragraphs (double newlines)
#     paragraphs = re.split(r'\n\s*\n', content)
#     current_chunk = []
#     current_size = 0

#     for para in paragraphs:
#         para_size = len(para.split())
#         if current_size + para_size <= max_chunk_size:
#             current_chunk.append(para)
#             current_size += para_size
#         else:
#             # Save current chunk if it meets minimum size
#             if current_size >= min_chunk_size:
#                 chunk_content = '\n\n'.join(current_chunk)
#                 paragraph_chunks.append(Chunk(
#                     header=section.header,
#                     content=chunk_content,
#                     path=section.path,
#                     is_partial=True
#                 ))

#             # Start new chunk with this paragraph
#             current_chunk = [para]
#             current_size = para_size

#     # Don't forget the last chunk
#     if current_chunk:
#         chunk_content = '\n\n'.join(current_chunk)
#         paragraph_chunks.append(Chunk(
#             header=section.header,
#             content=chunk_content,
#             path=section.path,
#             is_partial=True
#         ))
