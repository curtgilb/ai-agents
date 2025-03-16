from typing import Union
from pydantic import BaseModel
from fastapi import FastAPI
from embedder import embedder

app = FastAPI()


class EmbeddingRequest(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    embedding: list[float]


@app.post("/embed")
async def scrape_recipe(request_body: EmbeddingRequest):
    embedding = embedder.encode(request_body.text)
    return EmbeddingResponse(embedding=embedding)
