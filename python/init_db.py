from document_parser import ingest_documents
from database import collection_name

ingest_documents("./docs", collection_name)
