import os
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

# Load configuration from backend/.env
backend_env = PROJECT_DIR / "backend" / ".env"
if backend_env.is_file():
    load_dotenv(backend_env)

sqlite_db_path = BASE_DIR / "vss_ai.db"
mongo_uri = os.getenv("MongDB", "mongodb+srv://maithanihridesh9012_db_user:qYUbTEtIxfWpT8Gq@businessdb.xvrqecy.mongodb.net/test?retryWrites=true&w=majority")
db_name = os.getenv("DB_NAME", "test")

print("==================================================")
print(" VSS AI: Migrating SQLite Database to MongoDB Atlas")
print("==================================================")
print(f"Source SQLite: {sqlite_db_path}")
print(f"Target MongoDB: {db_name} on {mongo_uri.split('@')[-1]}")

if not sqlite_db_path.is_file():
    print(f"No SQLite database found at {sqlite_db_path}. Nothing to migrate.")
    exit(0)

conn = sqlite3.connect(sqlite_db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

client = MongoClient(mongo_uri)
mongo_db = client[db_name]

tables_to_migrate = [
    ("users", "users"),
    ("businesses", "businesses"),
    ("user_businesses", "user_businesses"),
    ("datasets", "datasets"),
    ("analysis_results", "analysis_results"),
    ("ml_models", "ml_models"),
    ("predictions", "predictions"),
    ("reports", "reports"),
    ("ai_conversations", "ai_conversations"),
    ("ai_messages", "ai_messages"),
    ("audit_logs", "audit_logs")
]

for table_name, coll_name in tables_to_migrate:
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        continue

    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    coll = mongo_db[coll_name]
    migrated_count = 0

    for r in rows:
        d = dict(r)
        row_id = str(d.get("id")) if d.get("id") else None
        if not row_id:
            continue

        d["_id"] = row_id
        # For users table, make sure email and password fields align with Node.js Mongoose schema
        if table_name == "users":
            if "password_hash" in d and "password" not in d:
                d["password"] = d["password_hash"]
            if "is_active" in d:
                d["isActive"] = bool(d["is_active"])

        coll.update_one({"_id": row_id}, {"$set": d}, upsert=True)
        migrated_count += 1

    print(f"✓ Table '{table_name}' -> Collection '{coll_name}': migrated/upserted {migrated_count} records.")

print("\n--- MongoDB Atlas Current Collections & Counts ---")
for coll_name in mongo_db.list_collection_names():
    count = mongo_db[coll_name].count_documents({})
    print(f" • {coll_name}: {count} documents")

print("\nMigration completed successfully!")
