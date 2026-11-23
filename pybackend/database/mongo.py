import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Type
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId

# Configure public DNS servers for resolving MongoDB Atlas SRV records reliably on Windows
try:
    import dns.resolver
    custom_resolver = dns.resolver.Resolver()
    custom_resolver.nameservers = ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
    dns.resolver.default_resolver = custom_resolver
except Exception as _e:
    pass

from config import settings

_mongo_client: Optional[MongoClient] = None


def get_mongo_client() -> MongoClient:
    global _mongo_client
    if _mongo_client is None:
        uri = getattr(settings, "MONGODB_URI", None) or os.getenv(
            "MongDB",
            "mongodb+srv://maithanihridesh9012_db_user:qYUbTEtIxfWpT8Gq@businessdb.xvrqecy.mongodb.net/test?retryWrites=true&w=majority"
        )
        _mongo_client = MongoClient(uri, serverSelectionTimeoutMS=5000, maxPoolSize=50)
    return _mongo_client


def get_mongo_db():
    client = get_mongo_client()
    db_name = getattr(settings, "MONGODB_DB_NAME", None) or os.getenv("DB_NAME", "test")
    return client[db_name]


# Map model class names to MongoDB collection names
MODEL_COLLECTION_MAP = {
    "User": "users",
    "Business": "businesses",
    "UserBusiness": "user_businesses",
    "Dataset": "datasets",
    "AnalysisResult": "analysis_results",
    "MLModel": "ml_models",
    "Prediction": "predictions",
    "Report": "reports",
    "AIConversation": "ai_conversations",
    "AIMessage": "ai_messages",
    "AuditLog": "audit_logs",
    "Workbook": "workbooks",
    "OTPVerification": "otp_verifications",
    "SubscriptionPlan": "subscription_plans",
    "UserSubscription": "user_subscriptions",
    "PaymentTransaction": "payment_transactions",
    "TrialExtensionHistory": "trial_extension_history",
    "AdminSubscriptionAction": "admin_subscription_actions",
}


def get_collection_name_for_model(model_cls) -> str:
    cls_name = getattr(model_cls, "__name__", str(model_cls))
    if cls_name in MODEL_COLLECTION_MAP:
        return MODEL_COLLECTION_MAP[cls_name]
    if hasattr(model_cls, "__tablename__"):
        return model_cls.__tablename__
    return cls_name.lower() + "s"


class MongoQuery:
    def __init__(self, session: "MongoSession", model_cls: Type[Any]):
        self.session = session
        self.model_cls = model_cls
        self.collection = session.db[get_collection_name_for_model(model_cls)]
        self._filters: Dict[str, Any] = {}
        self._or_filters: List[Dict[str, Any]] = []
        self._sort: List[tuple] = []
        self._limit: Optional[int] = None

    def filter(self, *expressions):
        for expr in expressions:
            self._parse_expression(expr)
        return self

    def _parse_expression(self, expr):
        if expr is None:
            return

        # Direct dictionary
        if isinstance(expr, dict):
            self._filters.update(expr)
            return

        # SQLAlchemy BinaryExpression (e.g. Model.field == value)
        left = getattr(expr, "left", None)
        right = getattr(expr, "right", None)
        operator = getattr(expr, "operator", None)

        if left is not None and right is not None:
            field_name = getattr(left, "name", str(left).split(".")[-1])
            val = getattr(right, "value", right)
            if type(val).__name__ == "False_":
                val = False
            elif type(val).__name__ == "True_":
                val = True
            elif type(val).__name__ == "Null":
                val = None

            # Handle primary key / id field
            if field_name == "id":
                str_val = str(val)
                # Query both _id and id for compatibility
                or_clause = [{"_id": str_val}, {"id": str_val}]
                if len(str_val) == 24:
                    try:
                        or_clause.append({"_id": ObjectId(str_val)})
                    except Exception:
                        pass
                self._or_filters.append({"$or": or_clause})
                return

            # Handle case-insensitive email equality
            if field_name == "email" and isinstance(val, str):
                self._filters["email"] = {"$regex": f"^{re.escape(val.strip())}$", "$options": "i"}
                return

            self._filters[field_name] = val
            return

        # Fallback if boolean or string
        if isinstance(expr, str):
            self._filters["_raw_str"] = expr

    def order_by(self, *expressions):
        for expr in expressions:
            # SQLAlchemy desc() / asc()
            element = getattr(expr, "element", None)
            modifier = getattr(expr, "modifier", None)
            if element is not None:
                field_name = getattr(element, "name", str(element).split(".")[-1])
                # Check if descending
                is_desc = modifier is not None or "DESC" in str(expr).upper()
                direction = DESCENDING if is_desc else ASCENDING
                self._sort.append((field_name, direction))
            elif isinstance(expr, str):
                field_name = expr.replace("-", "").strip()
                direction = DESCENDING if expr.startswith("-") else ASCENDING
                self._sort.append((field_name, direction))
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def _compile_filter(self) -> Dict[str, Any]:
        final_query = dict(self._filters)
        if self._or_filters:
            if "$and" not in final_query:
                final_query["$and"] = []
            final_query["$and"].extend(self._or_filters)
        return final_query

    def first(self) -> Optional[Any]:
        flt = self._compile_filter()
        doc = self.collection.find_one(flt, sort=self._sort if self._sort else None)
        if not doc:
            return None
        return self.session._doc_to_model(self.model_cls, doc)

    def all(self) -> List[Any]:
        flt = self._compile_filter()
        cursor = self.collection.find(flt)
        if self._sort:
            cursor = cursor.sort(self._sort)
        if self._limit:
            cursor = cursor.limit(self._limit)
        return [self.session._doc_to_model(self.model_cls, d) for d in cursor]

    def count(self) -> int:
        flt = self._compile_filter()
        return self.collection.count_documents(flt)

    def update(self, values: dict) -> int:
        """
        Executes bulk update on matching documents, supporting both raw dict keys
        and SQLAlchemy Column attributes.
        """
        flt = self._compile_filter()
        clean_values = {}
        for k, v in values.items():
            k_name = getattr(k, "name", str(k).split(".")[-1])
            clean_values[k_name] = v
        res = self.collection.update_many(flt, {"$set": clean_values})
        return res.modified_count

    def delete(self) -> int:
        """
        Executes bulk delete on matching documents.
        """
        flt = self._compile_filter()
        res = self.collection.delete_many(flt)
        return res.deleted_count


class MongoSession:
    def __init__(self, db=None):
        self.db = db if db is not None else get_mongo_db()
        self._staged_items = []
        self._deleted_items = []
        self._tracked_items = []

    def query(self, model_cls: Type[Any]) -> MongoQuery:
        return MongoQuery(self, model_cls)

    def add(self, instance: Any):
        if instance not in self._staged_items:
            self._staged_items.append(instance)

    def flush(self):
        # Persist all currently staged items immediately so subsequent queries find them
        for item in list(self._staged_items):
            self._save_instance(item)
        self._staged_items.clear()

        # Persist modified tracked instances loaded during this session
        for item in list(self._tracked_items):
            self._save_instance(item)

        for item in list(self._deleted_items):
            self._delete_instance(item)
        self._deleted_items.clear()

    def commit(self):
        self.flush()

    def rollback(self):
        self._staged_items.clear()
        self._deleted_items.clear()
        self._tracked_items.clear()

    def refresh(self, instance: Any):
        coll_name = get_collection_name_for_model(instance.__class__)
        coll = self.db[coll_name]
        inst_id = str(getattr(instance, "id", None) or getattr(instance, "_id", ""))
        doc = coll.find_one({"$or": [{"_id": inst_id}, {"id": inst_id}]})
        if doc:
            self._update_instance_from_doc(instance, doc)

    def delete(self, instance: Any):
        if instance in self._staged_items:
            self._staged_items.remove(instance)
        if instance not in self._deleted_items:
            self._deleted_items.append(instance)

    def close(self):
        self._staged_items.clear()
        self._deleted_items.clear()
        self._tracked_items.clear()

    def _save_instance(self, instance: Any):
        coll_name = get_collection_name_for_model(instance.__class__)
        coll = self.db[coll_name]

        # Extract attributes
        doc = {}
        # Ensure ID exists
        inst_id = getattr(instance, "id", None)
        if not inst_id:
            inst_id = str(uuid.uuid4())
            instance.id = inst_id

        # Inspect instance attributes
        for k, v in instance.__dict__.items():
            if k.startswith("_") or callable(v):
                continue
            doc[k] = v

        # Align User fields with Mongoose auth schema
        if coll_name == "users":
            if "password_hash" in doc and "password" not in doc:
                doc["password"] = doc["password_hash"]
            if "is_active" in doc and "isActive" not in doc:
                doc["isActive"] = bool(doc["is_active"])

        # Timestamp fields
        now = datetime.utcnow()
        if "created_at" not in doc or not doc["created_at"]:
            doc["created_at"] = now
        doc["updated_at"] = now

        # Build lookup query to find existing document
        lookup_or = [{"_id": str(inst_id)}, {"id": str(inst_id)}]
        if len(str(inst_id)) == 24:
            try:
                lookup_or.append({"_id": ObjectId(str(inst_id))})
            except Exception:
                pass

        # If user collection, also match by email to prevent duplicate key conflicts
        if coll_name == "users" and "email" in doc and doc["email"]:
            lookup_or.append({"email": doc["email"].strip().lower()})

        existing = coll.find_one({"$or": lookup_or})
        if existing:
            # Preserve existing _id and update in-place without _id in $set
            actual_id = existing["_id"]
            instance.id = str(actual_id)
            doc["id"] = str(actual_id)
            doc.pop("_id", None)
            coll.update_one({"_id": actual_id}, {"$set": doc})
        else:
            doc["_id"] = str(inst_id)
            doc["id"] = str(inst_id)
            coll.insert_one(doc)

        instance._session = self

    def _delete_instance(self, instance: Any):
        coll_name = get_collection_name_for_model(instance.__class__)
        coll = self.db[coll_name]
        inst_id = str(getattr(instance, "id", None) or getattr(instance, "_id", ""))
        coll.delete_one({"$or": [{"_id": inst_id}, {"id": inst_id}]})

    def _doc_to_model(self, model_cls: Type[Any], doc: Dict[str, Any]) -> Any:
        try:
            # Instantiate model
            instance = model_cls()
        except Exception:
            instance = object.__new__(model_cls)

        self._update_instance_from_doc(instance, doc)
        instance._session = self
        if instance not in self._tracked_items:
            self._tracked_items.append(instance)
        return instance

    def _update_instance_from_doc(self, instance: Any, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        raw_id = doc_copy.pop("_id", doc_copy.get("id"))
        instance.id = str(raw_id)

        # Specific user field normalization between Node Mongoose & Python
        if "password" in doc_copy and not getattr(instance, "password_hash", None):
            instance.password_hash = doc_copy["password"]
        if "isActive" in doc_copy:
            instance.is_active = doc_copy["isActive"]

        for k, v in doc_copy.items():
            # Parse ISO date strings if needed
            if isinstance(v, str) and ("_at" in k or k == "timestamp"):
                try:
                    setattr(instance, k, datetime.fromisoformat(v.replace("Z", "+00:00")))
                    continue
                except Exception:
                    pass
            setattr(instance, k, v)


# Configure dynamic relationship resolution for model navigation
_relationships_initialized = False

def setup_model_relationships():
    global _relationships_initialized
    if _relationships_initialized:
        return
    try:
        from database.models import (
            User, Business, UserBusiness, Dataset,
            AnalysisResult, MLModel, Prediction, Report,
            AIConversation, AIMessage
        )

        def make_list_rel(target_cls, foreign_key_field, sort_field=None):
            def getter(self):
                cached = getattr(self, f"_cached_{target_cls.__name__}_list", None)
                if cached is not None:
                    return cached
                sess = getattr(self, "_session", None)
                if sess and getattr(self, "id", None):
                    q = sess.query(target_cls).filter({foreign_key_field: str(self.id)})
                    if sort_field:
                        q = q.order_by(sort_field)
                    return q.all()
                return []
            def setter(self, val):
                setattr(self, f"_cached_{target_cls.__name__}_list", val)
            return property(getter, setter)

        def make_single_rel(target_cls, foreign_key_attr):
            def getter(self):
                cached = getattr(self, f"_cached_{target_cls.__name__}_single", None)
                if cached is not None:
                    return cached
                fk_val = getattr(self, foreign_key_attr, None)
                if not fk_val:
                    return None
                sess = getattr(self, "_session", None)
                if sess:
                    return sess.query(target_cls).filter({
                        "$or": [{"_id": str(fk_val)}, {"id": str(fk_val)}]
                    }).first()
                return None
            def setter(self, val):
                setattr(self, f"_cached_{target_cls.__name__}_single", val)
            return property(getter, setter)

        User.businesses = make_list_rel(UserBusiness, "user_id")
        User.datasets = make_list_rel(Dataset, "user_id")

        UserBusiness.user = make_single_rel(User, "user_id")
        UserBusiness.business = make_single_rel(Business, "business_id")

        Business.members = make_list_rel(UserBusiness, "business_id")
        Business.datasets = make_list_rel(Dataset, "business_id")
        Business.reports = make_list_rel(Report, "business_id")

        Dataset.business = make_single_rel(Business, "business_id")
        Dataset.user = make_single_rel(User, "user_id")
        Dataset.analyses = make_list_rel(AnalysisResult, "dataset_id")
        Dataset.models = make_list_rel(MLModel, "dataset_id")
        Dataset.reports = make_list_rel(Report, "dataset_id")

        AIConversation.messages = make_list_rel(AIMessage, "conversation_id", sort_field="created_at")
        AIMessage.conversation = make_single_rel(AIConversation, "conversation_id")

        MLModel.predictions = make_list_rel(Prediction, "model_id")

        _relationships_initialized = True
    except Exception as e:
        print("Warning: could not initialize model relationships:", e)

setup_model_relationships()
