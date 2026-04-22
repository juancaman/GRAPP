from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class Document(BaseModel):
    id: int
    text: str

# Sample data
documents = [
    Document(id=1, text="This is a document about cats."),
    Document(id=2, text="This is a document about dogs."),
    Document(id=3, text="This is a document about cats and dogs."),
]

@app.get("/search", response_model=List[Document])
def search_documents(query: str):
    """
    Search for documents containing the query string.
    """
    results = [doc for doc in documents if query.lower() in doc.text.lower()]
    if not results:
        raise HTTPException(status_code=404, detail="No documents found")
    return results

@app.get("/")
def read_root():
    return {"Hello": "World"}
