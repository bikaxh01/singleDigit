from config.db import user_collection, link_collection
from fastapi import FastAPI, Response, Request
from models.models import Links
from fastapi.responses import RedirectResponse
from models.models import User
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from utils.utils import (
    scrap_page,
    generate_summery,
    generate_embedding,
    get_sign_in_url,
    verify_code,
    generate_jwt,
    verify_jwt,
    get_similar_links,
)
from pydantic import BaseModel
from bson import ObjectId
import asyncio
from fastapi.responses import JSONResponse


load_dotenv()
app = FastAPI()

origins = [
    "http://localhost:3000",  # Example: your frontend application
    os.getenv("CLIENT_CALLBACK_URL"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies, authorization header  s, etc.
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Add the middleware to the app
@app.middleware("http")
async def auth_middleware(request: Request, call_next):

    # Allow CORS preflight requests to pass through
    if request.method == "OPTIONS":
        return await call_next(request)

    # Use startswith for dynamic routes and include more specific patterns
    public_routes = ["/sign-in", "/auth/"]

    # Check if the path starts with any public route
    is_public = any(request.url.path.startswith(route) for route in public_routes)

    if is_public:
        return await call_next(request)

    # Get token from cookie or Authorization header
    token = request.cookies.get("auth-token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return JSONResponse(
            status_code=401, content={"detail": "Authentication token required"}
        )

    try:
        # Verify the JWT token
        payload = verify_jwt(token)
        if not payload or not payload.get("id"):
            return JSONResponse(
                status_code=401, content={"detail": "Invalid token payload"}
            )

        request.state.user_id = payload.get("id")
        request.state.user_email = payload.get("email")
    except ValueError as e:
        # JWT specific errors
        return JSONResponse(
            status_code=401, content={"detail": f"Token validation failed: {str(e)}"}
        )
    except Exception as e:
        # Log the error for debugging
        print(f"Auth middleware error: {str(e)}")
        return JSONResponse(
            status_code=500, content={"detail": "Authentication service error"}
        )

    return await call_next(request)


class LinkRequest(BaseModel):
    link: str


async def async_generate_summery(content):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, generate_summery, content)


async def async_generate_embedding(content):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, generate_embedding, content)


@app.get("/")
def ping(response: Response):
    return {"status": "All Good 😎"}


@app.post("/links")
async def add_link(request: LinkRequest, req: Request):
    user_id = req.state.user_id

    # scrap content
    content = scrap_page(url=request.link)
    print(content)
    # Run summary and embedding generation in parallel
    summery_response, embeddings = await asyncio.gather(
        async_generate_summery(content), async_generate_embedding(content)
    )

    # save to db
    link_data = Links(
        url=request.link,
        user_id=ObjectId(user_id),
        title=summery_response.title,
        summary=summery_response.summery,
        content_embedding=embeddings,
    )

    # Save to db
    result = link_collection.insert_one(link_data.model_dump())

    saved_link = link_data.model_dump()
    saved_link["id"] = str(result.inserted_id)
    saved_link["user_id"] = str(
        saved_link["user_id"]
    )  # Convert ObjectId to string for JSON serialization

    return {
        "success": True,
        "message": "Link saved successfully",
        "data": saved_link,
    }


@app.get("/links")
async def get_links(req: Request):
    user_id = req.state.user_id
    cursor = link_collection.find(
        {"user_id": ObjectId(user_id)},
        {"content_embedding": 0},  # 0 means exclude  field
    )
    user_links = []

    for link in cursor:
        # Convert ObjectId to string for JSON serialization
        link["id"] = str(link["_id"])
        link["user_id"] = str(link["user_id"])
        del link["_id"]
        user_links.append(link)

    return {
        "success": True,
        "message": "successfully",
        "data": user_links,
    }


@app.get("/search")
def search_embedding(query: str, req: Request):
    user_id = req.state.user_id

    similar_links = get_similar_links(query, user_id)
    return {
        "success": True,
        "message": "successfully",
        "data": similar_links,
    }


@app.get("/sign-in")
def sign_in():
    res = get_sign_in_url()
    return {"redirect_url": res}


@app.get("/auth/callback")
def auth_google(code: str):
    user_data = verify_code(code)
    CLIENT_CALLBACK_URL = os.getenv("CLIENT_CALLBACK_URL")
    token = None

    # check user in db
    is_exists = user_collection.find_one({"email": user_data["email"]})

    if is_exists:
        user_id = str(is_exists["_id"])
        token = generate_jwt({"id": user_id, "email": user_data["email"]})
    else:
        # Create user
        new_user = User(email=user_data["email"], user_name=user_data.get("given_name"))

        result = user_collection.insert_one(new_user.model_dump())
        user_id = str(result.inserted_id)

        token = generate_jwt({"id": user_id, "email": user_data["email"]})

    redirect_response = RedirectResponse(CLIENT_CALLBACK_URL)
    redirect_response.set_cookie(
        key="auth-token",
        value=token,
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )

    return redirect_response


@app.get("/get-user")
async def get_user_details(req: Request):
    user_id = req.state.user_id
    user = user_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        return {
            "success": False,
            "message": "User not found",
            "data": None,
        }
    user["id"] = str(user["_id"])
    del user["_id"]

    return {
        "success": True,
        "message": "User details retrieved successfully",
        "data": user,
    }
