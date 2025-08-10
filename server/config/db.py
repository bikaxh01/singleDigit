from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.collection import Collection
from dotenv import load_dotenv
from models.models import User,Links

load_dotenv()
import os


uri = os.getenv("DB_URL")


client:MongoClient = MongoClient(uri, server_api=ServerApi("1"))

db = client["single_digit"]
user_collection:Collection[User]  = db["user"]
link_collection:Collection[Links]  = db["link"]


# try:
#     client.admin.command("ping")
#     print("Pinged your deployment. You successfully connected to MongoDB!")
# except Exception as e:
#     print(e)
#     os._exit(1)
