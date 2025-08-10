from firecrawl import FirecrawlApp
from dotenv import load_dotenv
from markdown import markdown
from config.db import link_collection
from typing import List
import re
import jwt
from google.genai import types
import requests
from urllib.parse import urlencode
from pydantic import BaseModel, Field
from google import genai
import os
from bson import ObjectId
from pymongo.operations import SearchIndexModel
from datetime import datetime, timedelta
import time

load_dotenv()

API_KEY = os.getenv("FIRECRAWL_API")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_REDIRECT_URL = os.getenv("GOOGLE_REDIRECT_URL")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

firecrawl_client = FirecrawlApp(api_key=API_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY)

client = genai.Client()


def scrap_page(url: str) -> str:
    scrape_result = firecrawl_client.scrape_url(url, only_main_content=True)
    html = markdown(scrape_result.markdown)
    plain_text = re.sub("<[^<]+?>", "", html)

    return plain_text


class Structured_response(BaseModel):
    """The response should strictly follow this schema"""

    title: str = Field(description="short title of the summery")
    summery: str = Field(description="summery of the content")


def generate_summery(text: str) -> Structured_response:
    print("Generating summery 🟢")
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=f"""You are an expert AI content summarizer with 10 years of professional experience in content writing. Your task is to read the provided text (enclosed between [START] and [END]) and generate a clear, concise, and rich summary. The summary should be easy to understand, capture all key points, and maintain the essence of the original content while improving readability and flow.

Content :
[START] {text} [END]
    """,
        config={
            "response_mime_type": "application/json",
            "response_schema": Structured_response,
        },
    )

    final_response: Structured_response = response.parsed

    return final_response


def generate_embedding(text: str) -> List[float]:
    print("Generating embedding  🟢")
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=3072),
    )

    return result.embeddings[0].values


GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_sign_in_url():
    query_params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URL,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }

    url = f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(query_params)}"
    return url


def verify_code(code: str):
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URL,
        "grant_type": "authorization_code",
    }
    response = requests.post(GOOGLE_TOKEN_ENDPOINT, data=data)
    access_token = response.json().get("access_token")
    user_info = requests.get(
        GOOGLE_USER_INFO_ENDPOINT, headers={"Authorization": f"Bearer {access_token}"}
    )
    return user_info.json()


def generate_jwt(payload):
    JWT_SECRET = os.getenv("JWT_SECRET")

    token = jwt.encode(
        payload={**payload, "exp": datetime.utcnow() + timedelta(hours=24)},
        key=JWT_SECRET,
        algorithm="HS256",
    )

    return token


def verify_jwt(token):

    try:
        JWT_SECRET = os.getenv("JWT_SECRET")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_similar_links(query: str, user_id: str):
    try:
        query_embedding = generate_embedding(query)

        # Check if index already exists before creating
        existing_indexes = list(link_collection.list_search_indexes())

        index_exists = any(
            idx.get("name") == "vector_index" for idx in existing_indexes
        )

        if not index_exists:
            search_index_model = SearchIndexModel(
                definition={
                    "fields": [
                        {
                            "type": "vector",
                            "path": "content_embedding",
                            "numDimensions": 3072,
                            "similarity": "cosine",
                        }
                    ]
                },
                name="vector_index",
                type="vectorSearch",
            )
            result = link_collection.create_search_index(model=search_index_model)
            print(f"Index '{result}' is building...")

            while True:
                idx_info = list(link_collection.list_search_indexes(result))
                if idx_info and idx_info[0].get("queryable"):
                    break
                time.sleep(5)

        # Try a simple vector search first without user filter
        pipeline = [
            {
                "$vectorSearch": {
                    "queryVector": query_embedding,
                    "path": "content_embedding",
                    "numCandidates": 100,
                    "limit": 50,
                    "index": "vector_index",
                }
            },
            {"$match": {"user_id": ObjectId(user_id)}},
            {
                "$project": {
                    "_id": 1,
                    # "user_id": 1,
                    "title": 1,
                    "url": 1,
                    "summary":1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        results = list(link_collection.aggregate(pipeline))
        final_result = []

        for i, doc in enumerate(results):
             doc["id"] = str(doc["_id"])
             del doc["_id"]
             final_result.append(doc)

        return final_result

    except Exception as e:
        print(f"❌ Error in get_similar_links: {str(e)}")
        return []
