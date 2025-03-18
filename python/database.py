from qdrant_client import QdrantClient
from qdrant_client.models import ScoredPoint
from embedder import embedder
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from dataclasses import dataclass
import numpy as np

collection_name = "AutoGPT"

db = QdrantClient(url="http://qdrant:6333")

cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


@dataclass
class QueryItem:
    text: str
    token_count: int
    vector_score: float
    lexical_score: float = None
    semantic_score: float = None

    @property
    def prerank_score(self) -> float:
        return (self.lexical_score or 0) * 0.5 + (self.vector_score or 0) * 0.5


@dataclass
class QueryResponse:
    items: list[QueryItem]
    token_count: int


def query_database(query: str):
    query_vector = embedder.encode(query)

    db_results = db.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=200
    )

    query_items = [QueryItem(text=result.payload.get("content"), token_count=result.payload.get("token_count"), vector_score=result.score)
                   for result in db_results.points]

    _calc_lexical_score(query_items, query)
    # Take the top 80
    preranked = sorted(
        query_items, key=lambda item: item.prerank_score, reverse=True)[:80]

    _calc_semantic_score(preranked, query)

    # Just return the vector score
    #  final_list = sorted(query_items, key=lambda item: item.vector_score, reverse=True)[:20]
    final_list = sorted(
        preranked, key=lambda item: item.semantic_score, reverse=True)[:20]

    total_tokens = sum(item.token_count for item in final_list)

    return QueryResponse(items=final_list, token_count=total_tokens)


def _calc_lexical_score(query_results: list[QueryItem], query: str):
    result_texts = []
    for result in query_results:
        content = result.text
        result_texts.append(content.split())
    raw_scores = BM25Okapi(result_texts).get_scores(query.split())
    _normalize_scores(query_results, raw_scores, "lexical_score")


def _calc_semantic_score(query_results: list[QueryItem], query: str):
    pairs = [(query, result.text)
             for result in query_results]
    cross_scores = cross_encoder.predict(pairs)
    _normalize_scores(query_results, cross_scores, "semantic_score")


def _normalize_scores(query_items: list[QueryItem], scores: np.ndarray, attribute: str):
    assert (len(query_items) == len(scores))
    min_score = scores.min()
    max_score = scores.max()

    for idx, item in enumerate(query_items):
        score = scores[idx]
        if hasattr(item, attribute):
            normalized_score = (score - min_score) / (max_score - min_score)
            setattr(item, attribute, normalized_score.item())
        else:
            raise KeyError(f"{str} does not exist")
