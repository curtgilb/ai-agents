import os
import re
from typing import List, Tuple
from dataclasses import dataclass


@dataclass
class Chunk:
    header: str
    content: str
    path: str
    header_path: str
    is_partial: bool = False
    embedding: str = None


def extract_header_info(line: str) -> Tuple[int, str]:
    """Extract header level and text from a markdown header line."""
    match = re.match(r'^(#{1,6})\s+(.+)$', line)
    if not match:
        return 0, ""
    level = len(match.group(1))
    text = match.group(2).strip()
    return level, text


def update_header_stack(stack: List[Tuple[int, str]], level: int, text: str) -> List[Tuple[int, str]]:
    """Update the header stack based on the new header level."""
    # Make a copy to avoid modifying the original
    new_stack = stack.copy()

    # Remove headers at the same or higher level
    while new_stack and new_stack[-1][0] >= level:
        new_stack.pop()

    # Add the new header
    new_stack.append((level, text))
    return new_stack


def get_header_info(stack: List[Tuple[int, str]]) -> Tuple[str, str]:
    """Get current header and full header path from stack."""
    if not stack:
        return "Introduction", "Introduction"

    current_header = stack[-1][1]
    header_path = ' > '.join(h[1] for h in stack)
    return current_header, header_path


def create_chunk_from_lines(lines: List[str], header_stack: List[Tuple[int, str]], file_path: str, is_partial=False) -> Chunk:
    """Create a chunk from collected lines and header information."""
    current_header, header_path = get_header_info(header_stack)

    return Chunk(
        header=current_header,
        content='\n'.join(lines),
        path=os.path.basename(file_path),
        is_partial=is_partial,
        header_path=header_path
    )


def chunk_file(content: str, file_path: str) -> List[Chunk]:
    """Split content by headers with hierarchy tracking."""
    sections = []
    current_lines = []
    header_stack = []

    for line in content.split('\n'):
        level, text = extract_header_info(line)

        if level > 0:  # This is a header
            # Save previous section if not empty
            if ''.join(current_lines).strip():
                sections.append(create_chunk_from_lines(
                    current_lines, header_stack, file_path))

            # Update header stack
            header_stack = update_header_stack(header_stack, level, text)
            current_lines = []
        else:
            current_lines.append(line)

    # Handle last section
    if ''.join(current_lines).strip():
        sections.append(create_chunk_from_lines(
            current_lines, header_stack, file_path))

    return sections


def split_into_paragraphs(text: str) -> List[str]:
    """Split text into paragraphs based on blank lines."""
    return re.split(r'\n\s*\n', text)


def count_words(text: str) -> int:
    """Count words in a text string."""
    return len(text.split())


def group_paragraphs(paragraphs: List[str], min_size: int, max_size: int) -> List[List[str]]:
    """Group paragraphs into chunks that fit size constraints."""
    groups = []
    current_group = []
    current_size = 0

    for para in paragraphs:
        para_size = count_words(para)

        # If adding this paragraph exceeds max_size and we've reached min_size
        if current_size + para_size > max_size and current_size >= min_size:
            groups.append(current_group)
            current_group = [para]
            current_size = para_size
        else:
            current_group.append(para)
            current_size += para_size

    # Add the last group if not empty
    if current_group:
        groups.append(current_group)

    return groups


def paragraphs_to_chunks(paragraph_groups: List[List[str]], source_chunk: Chunk) -> List[Chunk]:
    """Convert paragraph groups to Chunk objects."""
    result = []

    for group in paragraph_groups:
        result.append(Chunk(
            header=source_chunk.header,
            content='\n\n'.join(group),
            path=source_chunk.path,
            is_partial=True,
            header_path=source_chunk.header_path
        ))

    return result


def chunk_by_size(chunks: List[Chunk], min_size: int, max_size: int) -> List[Chunk]:
    """Split chunks that are too large by paragraphs."""
    result = []

    for chunk in chunks:
        # If chunk is small enough, keep as is
        if count_words(chunk.content) <= max_size:
            result.append(chunk)
            continue

        # Split large chunks
        paragraphs = split_into_paragraphs(chunk.content)
        paragraph_groups = group_paragraphs(paragraphs, min_size, max_size)
        result.extend(paragraphs_to_chunks(paragraph_groups, chunk))

    return result
