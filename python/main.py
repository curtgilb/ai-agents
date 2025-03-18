from typing import Union
from pydantic import BaseModel
from fastapi import FastAPI
from database import query_database, QueryResponse

app = FastAPI()


@app.get("/query", response_model=QueryResponse)
async def query_db(query: str) -> QueryResponse:
    return query_database(query)
