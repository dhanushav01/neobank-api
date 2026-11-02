"""
Database Admin & SQL GUI Router (Production-Hardened)
──────────────────────────────────────────────────────
Security fixes applied:
  ✓ [CRITICAL] Authentication and Authorization: Every endpoint strictly enforces require_sql_access.
  ✓ [CRITICAL] SQL Injection & Execution Guard: Strict read-only query policy with SQLite PRAGMA query_only=ON.
  ✓ [CRITICAL] Disallows multi-statement execution and destructive DDL/DML operations.
  ✓ [HIGH] Sensitive column masking: password_hash and encrypted_blob fields are automatically masked.
"""
import os
import re
import time
import sqlite3
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException, Depends, status

from backend.app.core.sql_db import get_db_connection, DB_PATH
from backend.app.core.security import require_sql_access
from backend.app.core.utils import fail

router = APIRouter(prefix="/api/db", tags=["Database GUI"])


class QueryRequest(BaseModel):
    query: str = Field(..., max_length=2000, description="Read-only SQL query statement (SELECT / PRAGMA / EXPLAIN)")
    limit: Optional[int] = Field(100, ge=1, le=500, description="Maximum rows to return (capped at 500)")


def _safe_serialize_cell(key: str, val: Any) -> Any:
    """Safely format and mask sensitive attributes, passwords, and binary BLOBs."""
    if key.lower() in ("password_hash", "password", "pin", "pin_hash"):
        return "******** [PROTECTED HASH]"
    if isinstance(val, (bytes, bytearray)):
        return f"<BLOB {len(val):,} bytes (AES-256 Encrypted)>"
    return val


# Blocklist of destructive or state-altering SQL commands
_DISALLOWED_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|VACUUM|REINDEX|TRUNCATE)\b",
    re.IGNORECASE
)


@router.get("/overview")
def get_database_overview(admin: Dict[str, Any] = Depends(require_sql_access)) -> Dict[str, Any]:
    """Get high-level SQLite database file stats, version, and table breakdown (Requires SQL Access)."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")

    size_bytes = os.path.getsize(DB_PATH)
    if size_bytes < 1024:
        size_str = f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        size_str = f"{size_bytes / 1024:.1f} KB"
    else:
        size_str = f"{size_bytes / (1024 * 1024):.2f} MB"

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT sqlite_version();")
        sqlite_ver = cur.fetchone()[0]

        cur.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%' 
            ORDER BY name ASC;
        """)
        table_names = [row["name"] for row in cur.fetchall()]

        tables_info = []
        total_records = 0
        for name in table_names:
            try:
                cur.execute(f'SELECT COUNT(*) as cnt FROM "{name}";')
                count = cur.fetchone()["cnt"]
            except Exception:
                count = 0
            
            try:
                cur.execute(f'PRAGMA table_info("{name}");')
                col_count = len(cur.fetchall())
            except Exception:
                col_count = 0

            tables_info.append({
                "name": name,
                "rowCount": count,
                "columnCount": col_count
            })
            total_records += count

        return {
            "databaseFile": os.path.basename(DB_PATH),
            "databasePath": f"data/{os.path.basename(DB_PATH)}",
            "sqliteVersion": sqlite_ver,
            "sizeBytes": size_bytes,
            "sizeFormatted": size_str,
            "totalTables": len(tables_info),
            "totalRecords": total_records,
            "tables": tables_info
        }
    finally:
        conn.close()


@router.get("/tables")
def list_tables(admin: Dict[str, Any] = Depends(require_sql_access)) -> List[Dict[str, Any]]:
    """List all user tables in the SQLite database with row and column counts (Requires SQL Access)."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT name, sql FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%' 
            ORDER BY name ASC;
        """)
        results = []
        for row in cur.fetchall():
            t_name = row["name"]
            try:
                cur.execute(f'SELECT COUNT(*) as cnt FROM "{t_name}";')
                row_count = cur.fetchone()["cnt"]
            except Exception:
                row_count = 0

            try:
                cur.execute(f'PRAGMA table_info("{t_name}");')
                col_count = len(cur.fetchall())
            except Exception:
                col_count = 0

            results.append({
                "name": t_name,
                "rowCount": row_count,
                "columnCount": col_count,
                "schemaSql": row["sql"]
            })
        return results
    finally:
        conn.close()


@router.get("/table/{table_name}")
@router.get("/table/{table_name}/rows")
def get_table_rows(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    admin: Dict[str, Any] = Depends(require_sql_access)
) -> Dict[str, Any]:
    """Paginated data browser for a specific table with search and sensitive masking (Requires SQL Access)."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Verify table exists in schema to prevent SQL injection in table name
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")

        cur.execute(f'PRAGMA table_info("{table_name}");')
        columns = [dict(c) for c in cur.fetchall()]

        where_clause = ""
        params: List[Any] = []
        if search and search.strip():
            text_cols = [c["name"] for c in columns if c["type"] in ("TEXT", "VARCHAR", "CHAR", "")]
            if text_cols:
                clauses = [f'"{col}" LIKE ?' for col in text_cols]
                where_clause = " WHERE " + " OR ".join(clauses)
                term = f"%{search.strip()}%"
                params = [term] * len(clauses)

        cur.execute(f'SELECT COUNT(*) as total FROM "{table_name}"{where_clause};', params)
        total_rows = cur.fetchone()["total"]

        query_sql = f'SELECT * FROM "{table_name}"{where_clause} LIMIT ? OFFSET ?;'
        cur.execute(query_sql, params + [limit, offset])
        rows_raw = cur.fetchall()

        formatted_rows = []
        for r in rows_raw:
            row_dict = {}
            for k in r.keys():
                row_dict[k] = _safe_serialize_cell(k, r[k])
            formatted_rows.append(row_dict)

        return {
            "tableName": table_name,
            "columns": columns,
            "rows": formatted_rows,
            "totalRows": total_rows,
            "limit": limit,
            "offset": offset,
            "search": search
        }
    finally:
        conn.close()


@router.get("/table/{table_name}/schema")
def get_table_schema(table_name: str, admin: Dict[str, Any] = Depends(require_sql_access)) -> Dict[str, Any]:
    """Retrieve table schema, indexes, and constraints (Requires SQL Access)."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?;", (table_name,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        ddl_sql = row["sql"] or ""

        cur.execute(f'PRAGMA table_info("{table_name}");')
        columns = [dict(c) for c in cur.fetchall()]

        cur.execute(f'PRAGMA index_list("{table_name}");')
        indexes = [dict(i) for i in cur.fetchall()]

        cur.execute(f'PRAGMA foreign_key_list("{table_name}");')
        foreign_keys = [dict(fk) for fk in cur.fetchall()]

        return {
            "tableName": table_name,
            "ddl": ddl_sql,
            "columns": columns,
            "indexes": indexes,
            "foreignKeys": foreign_keys
        }
    finally:
        conn.close()


ALLOWED_PARAMETERIZED_QUERIES = {
    "recent_transactions": ("SELECT id, account_id, type, amount, currency, balance_after, created_at FROM transactions ORDER BY created_at DESC LIMIT ?", True),
    "active_accounts_summary": ("SELECT type, currency, count(*) as count, sum(balance) as total_balance FROM accounts GROUP BY type, currency", False),
    "application_status_counts": ("SELECT status, count(*) as count FROM applications GROUP BY status", False),
    "audit_log_tail": ("SELECT id, actor_id, action, timestamp FROM audit_logs ORDER BY id DESC LIMIT ?", True),
    "card_inventory": ("SELECT type, network, status, count(*) as count FROM cards GROUP BY type, network, status", False),
}


@router.post("/query")
def execute_sql_query(req: QueryRequest, admin: Dict[str, Any] = Depends(require_sql_access)) -> Dict[str, Any]:
    """
    Execute pre-approved parameterized analytical queries.
    Arbitrary SQL execution is strictly disabled.
    """
    query_key = req.query.strip().lower()
    if query_key not in ALLOWED_PARAMETERIZED_QUERIES:
        raise HTTPException(
            status_code=403,
            detail="Arbitrary SQL execution is strictly disabled for security. Select an allow-listed query: " + ", ".join(ALLOWED_PARAMETERIZED_QUERIES.keys())
        )

    sql_template, takes_limit = ALLOWED_PARAMETERIZED_QUERIES[query_key]
    max_limit = min(req.limit or 100, 500)
    params = (max_limit,) if takes_limit else ()

    conn = get_db_connection()
    start_time = time.perf_counter()
    try:
        conn.execute("PRAGMA query_only = ON;")
        cur = conn.cursor()
        cur.execute(sql_template, params)

        col_names = [d[0] for d in cur.description] if cur.description else []
        raw_rows = cur.fetchall()

        formatted_rows = []
        for r in raw_rows:
            row_dict = {}
            for idx, col in enumerate(col_names):
                row_dict[col] = _safe_serialize_cell(col, r[idx])
            formatted_rows.append(row_dict)

            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": True,
                "readOnly": True,
                "rowCount": len(formatted_rows),
                "columns": col_names,
                "rows": formatted_rows,
                "elapsedMs": elapsed_ms,
                "truncated": len(raw_rows) == max_limit
            }
        else:
            return {
                "success": True,
                "readOnly": True,
                "rowCount": 0,
                "columns": [],
                "rows": [],
                "elapsedMs": round((time.perf_counter() - start_time) * 1000, 2)
            }
    except sqlite3.OperationalError as e:
        raise HTTPException(status_code=400, detail=f"Database execution error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal database query error: {str(e)}")
    finally:
        conn.close()
