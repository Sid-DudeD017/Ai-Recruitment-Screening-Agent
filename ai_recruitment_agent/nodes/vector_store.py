import os
from typing import List, Dict, Any
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

def get_embeddings():
    """Get the configured OpenAI embeddings model."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set. Cannot generate embeddings.")
    return OpenAIEmbeddings(openai_api_key=api_key)

def create_resume_vectorstore(resume_text: str) -> FAISS:
    """
    Chunks the raw resume text and creates a FAISS vector store.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len
    )
    chunks = text_splitter.split_text(resume_text)
    
    docs = [Document(page_content=chunk) for chunk in chunks]
    
    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(docs, embeddings)
    return vectorstore

def semantic_search_resume(vectorstore: FAISS, queries: List[str], top_k: int = 3) -> str:
    """
    Given a list of queries (e.g., job requirements), search the resume vector store
    for the most relevant chunks. Returns a combined string of the relevant context.
    """
    relevant_chunks = []
    
    # We query the vector store for each requirement to ensure we cover all bases
    for query in queries:
        docs = vectorstore.similarity_search(query, k=top_k)
        for doc in docs:
            if doc.page_content not in relevant_chunks:
                relevant_chunks.append(doc.page_content)
                
    # Combine chunks into a single context string
    context = "\n---\n".join(relevant_chunks)
    return context
