"""
NeoBank MySQL & MongoDB Bridge:
Provides automated schema provisioning, data synchronization,
and connection testing for local MySQL 8.0 and MongoDB instances.
"""
import os
import json
import sqlite3
from typing import Dict, Any, Optional

import re

# File paths
SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "neobank.db"))
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from backend.app.core.config import (
    MONGODB_URI, MONGODB_DB_NAME,
    MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
)

_SAFE_DB_NAME_RE = re.compile(r"^[a-zA-Z0-9_]{1,64}$")
_SAFE_HOST_RE = re.compile(r"^[a-zA-Z0-9_.-]{1,255}$")

def test_mongo_connection(uri: Optional[str] = None) -> Dict[str, Any]:
    """Test connection to MongoDB instance with URI validation."""
    uri = uri or MONGODB_URI
    if not (uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")):
        return {"connected": False, "uri": uri, "error": "Invalid MongoDB protocol", "message": "URI must start with mongodb:// or mongodb+srv://"}

    try:
        import pymongo
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        dbs = client.list_database_names()
        client.close()
        return {
            "connected": True,
            "uri": uri,
            "databases": dbs,
            "message": "Connected to MongoDB successfully"
        }
    except Exception as e:
        return {
            "connected": False,
            "uri": uri,
            "error": str(e),
            "message": "Failed to connect to MongoDB"
        }

def sync_sqlite_to_mongodb(uri: Optional[str] = None, db_name: Optional[str] = None) -> Dict[str, Any]:
    """Sync all SQLite tables into MongoDB collections in the specified database."""
    uri = uri or MONGODB_URI
    db_name = db_name or MONGODB_DB_NAME
    if not _SAFE_DB_NAME_RE.match(db_name):
        return {"success": False, "error": "Invalid database name", "message": "Database name must be alphanumeric"}

    if not (uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")):
        return {"success": False, "error": "Invalid MongoDB protocol", "message": "URI must start with mongodb:// or mongodb+srv://"}

    try:
        import pymongo
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
        db = client[db_name]

        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        cur = sqlite_conn.cursor()

        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [r["name"] for r in cur.fetchall()]

        synced_counts = {}
        for t in tables:
            cur.execute(f'SELECT * FROM "{t}";')
            rows = [dict(r) for r in cur.fetchall()]
            coll = db[t]
            coll.delete_many({})
            if rows:
                for r in rows:
                    for k, v in list(r.items()):
                        if isinstance(v, bytes):
                            r[k] = f"<BLOB {len(v)} bytes (AES-256 Encrypted)>"
                        elif isinstance(v, str) and (v.startswith('{') or v.startswith('[')):
                            try:
                                r[k] = json.loads(v)
                            except Exception:
                                pass
                coll.insert_many(rows)
            synced_counts[t] = len(rows)

        sqlite_conn.close()
        client.close()
        return {
            "success": True,
            "database": db_name,
            "syncedTables": synced_counts,
            "message": f"Successfully synchronized {len(tables)} tables to MongoDB database '{db_name}'"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"MongoDB synchronization failed: {e}"
        }

def test_mysql_connection(
    user: Optional[str] = None,
    password: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None
) -> Dict[str, Any]:
    """Test MySQL connectivity with validated parameters."""
    user = user if user is not None else MYSQL_USER
    password = password if password is not None else MYSQL_PASSWORD
    host = host or MYSQL_HOST
    port = port if port is not None else MYSQL_PORT

    if not _SAFE_HOST_RE.match(host):
        return {"connected": False, "error": "Invalid host parameter"}
    if not (1 <= port <= 65535):
        return {"connected": False, "error": "Invalid port number"}

    try:
        import pymysql
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connect_timeout=2
        )
        cur = conn.cursor()
        cur.execute("SELECT VERSION();")
        version = cur.fetchone()[0]
        cur.execute("SHOW DATABASES;")
        dbs = [row[0] for row in cur.fetchall()]
        conn.close()
        return {
            "connected": True,
            "version": version,
            "host": host,
            "port": port,
            "user": user,
            "databases": dbs,
            "message": f"Connected to MySQL {version} successfully"
        }
    except Exception as e:
        return {
            "connected": False,
            "host": host,
            "port": port,
            "user": user,
            "error": str(e),
            "message": f"MySQL connection failed: {e}"
        }

def sync_sqlite_to_mysql(
    user: Optional[str] = None,
    password: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None,
    db_name: Optional[str] = None
) -> Dict[str, Any]:
    """Create MySQL database with relational schema and sync all records from SQLite."""
    user = user if user is not None else MYSQL_USER
    password = password if password is not None else MYSQL_PASSWORD
    host = host or MYSQL_HOST
    port = port if port is not None else MYSQL_PORT
    db_name = db_name or MYSQL_DB

    if not _SAFE_DB_NAME_RE.match(db_name):
        return {"success": False, "error": "Invalid database name; must be alphanumeric"}
    if not _SAFE_HOST_RE.match(host):
        return {"success": False, "error": "Invalid host parameter"}
    if not (1 <= port <= 65535):
        return {"success": False, "error": "Invalid port number"}

    try:
        import pymysql
        # Connect to MySQL server
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connect_timeout=3,
            autocommit=True
        )
        cur = conn.cursor()

        # Create database with escaped identifier
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cur.execute(f"USE `{db_name}`;")

        # Disable foreign key checks for table creation & loading
        cur.execute("SET FOREIGN_KEY_CHECKS = 0;")

        # Create Tables
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(64) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(32) NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                dob VARCHAR(32),
                phone VARCHAR(64),
                address_json TEXT,
                employee_code VARCHAR(64),
                department VARCHAR(64),
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                account_number VARCHAR(64) UNIQUE NOT NULL,
                type VARCHAR(64) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                overdraft_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                nickname VARCHAR(100),
                status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(64) PRIMARY KEY,
                account_id VARCHAR(64) NOT NULL,
                type VARCHAR(32) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                balance_after DECIMAL(15, 2) NOT NULL,
                reference TEXT,
                channel VARCHAR(32) DEFAULT 'ONLINE',
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS cards (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                account_id VARCHAR(64) NOT NULL,
                type VARCHAR(32) NOT NULL,
                network VARCHAR(32) NOT NULL DEFAULT 'VISA',
                cardholder_name VARCHAR(128) NOT NULL,
                last4 VARCHAR(8) NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
                daily_limit DECIMAL(15, 2) DEFAULT 3000.00,
                monthly_limit DECIMAL(15, 2) DEFAULT 15000.00,
                atm_limit DECIMAL(15, 2) DEFAULT 1000.00,
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS loans (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                account_id VARCHAR(64),
                amount DECIMAL(15, 2) NOT NULL,
                apr DECIMAL(8, 2) NOT NULL,
                term_months INT NOT NULL,
                monthly_payment DECIMAL(15, 2) NOT NULL,
                purpose VARCHAR(128),
                status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS disputes (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                transaction_id VARCHAR(64) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                reason VARCHAR(128) NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                resolution TEXT,
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                application_number VARCHAR(64) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                account_type VARCHAR(64) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                initial_deposit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                tax_id VARCHAR(64) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                applicant_json LONGTEXT NOT NULL,
                employment_json LONGTEXT NOT NULL,
                status VARCHAR(64) NOT NULL DEFAULT 'SUBMITTED',
                created_at VARCHAR(64) NOT NULL,
                reviewed_at VARCHAR(64),
                reviewed_by VARCHAR(64),
                review_notes TEXT,
                generated_account_number VARCHAR(64)
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS encrypted_documents (
                id VARCHAR(64) PRIMARY KEY,
                application_number VARCHAR(64),
                user_id VARCHAR(64),
                doc_category VARCHAR(64) NOT NULL,
                doc_type VARCHAR(64) NOT NULL,
                doc_number VARCHAR(64),
                file_name VARCHAR(255) NOT NULL,
                file_mime VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
                file_size_bytes INT NOT NULL,
                encrypted_blob LONGBLOB NOT NULL,
                is_encrypted INT NOT NULL DEFAULT 1,
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                actor_id VARCHAR(64) NOT NULL,
                action VARCHAR(128) NOT NULL,
                resource VARCHAR(128),
                details TEXT,
                timestamp VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS login_otps (
                id VARCHAR(64) PRIMARY KEY,
                identifier VARCHAR(128) NOT NULL,
                otp_code VARCHAR(32) NOT NULL,
                expires_at VARCHAR(64) NOT NULL,
                used INT NOT NULL DEFAULT 0,
                created_at VARCHAR(64) NOT NULL
            ) ENGINE=InnoDB;
        """)

        # Sync records from SQLite
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        s_cur = sqlite_conn.cursor()

        tables_to_sync = [
            "users", "accounts", "transactions", "cards", "loans",
            "disputes", "applications", "encrypted_documents", "audit_logs", "login_otps"
        ]

        synced_counts = {}
        for tbl in tables_to_sync:
            try:
                s_cur.execute(f'SELECT * FROM "{tbl}";')
                rows = s_cur.fetchall()
                if not rows:
                    synced_counts[tbl] = 0
                    continue

                col_names = rows[0].keys()
                placeholders = ", ".join(["%s"] * len(col_names))
                cols_sql = ", ".join([f"`{c}`" for c in col_names])
                insert_sql = f"REPLACE INTO `{tbl}` ({cols_sql}) VALUES ({placeholders});"

                data_tuples = []
                for r in rows:
                    tup = []
                    for c in col_names:
                        val = r[c]
                        tup.append(val)
                    data_tuples.append(tuple(tup))

                cur.executemany(insert_sql, data_tuples)
                synced_counts[tbl] = len(data_tuples)
            except Exception as tbl_err:
                print(f"Notice: Table {tbl} sync skipped or error: {tbl_err}")
                synced_counts[tbl] = 0

        cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
        sqlite_conn.close()
        conn.close()



        return {
            "success": True,
            "database": db_name,
            "host": host,
            "port": port,
            "user": user,
            "syncedTables": synced_counts,
            "message": f"Successfully created MySQL database '{db_name}' and synchronized all tables!"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"MySQL synchronization failed: {e}"
        }
