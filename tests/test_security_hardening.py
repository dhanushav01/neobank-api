"""
NeoBank Security Hardening Integration & Unit Tests
===================================================
Covers the 4 critical security assertions requested:
1. Cookie-authenticated POST without X-Requested-With / Origin returns 403 and succeeds with it.
2. ENABLE_TEST_ROUTES=false gives 403 on /delay, /flaky, and /rate-limit.
3. ENVIRONMENT=production hides /docs and /redoc (returns 404).
4. SEED_DEMO_USERS=false creates no demo users and admin@bank.test cannot log in on a fresh database.
"""
import os
import gc
import unittest
import importlib
from starlette.testclient import TestClient

# Ensure test JWT secrets and tokens
os.environ["ENVIRONMENT"] = "development"
os.environ["SEED_DEMO_USERS"] = "true"
os.environ["JWT_SECRET"] = "c717bfbbbb7b24d10c5be5899cfe2f9af7417f1e252279dcc1411d794a4d0cf6"
os.environ["NEOBANK_DOC_KEY"] = "u1z6Qci_7ZZl6RIHIaKkQS-um5A1MRxB6ZdbcegO4cM="
os.environ["POS_GATEWAY_KEY"] = "c68a4caf2261e0afac78effe4afbf90e563680c60f627bffc79dbdf5caeb97f6"

from backend.app.main import app
from backend.app.core.database import DB, reset_db
from backend.app.core.limiter import limiter


class TestSecurityHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        limiter.enabled = False
        app.state.limiter.enabled = False
        cls.client = TestClient(app)
        reset_db()

        # Retrieve valid customer access token via login
        login_res = cls.client.post("/auth/login", json={
            "email": "customer@bank.test",
            "password": "Customer@1234"
        })
        cls.cust_token = login_res.json()["accessToken"]

    def test_01_cookie_csrf_protection_on_state_changing_post(self):
        """
        Verify that cookie-authenticated POST without X-Requested-With or Origin
        returns 403 Forbidden (Anti-CSRF), and succeeds once X-Requested-With or Origin is supplied.
        """
        # Scenario A: Calling POST with cookie only, NO anti-CSRF header -> 403 CSRF
        client_no_csrf = TestClient(app, cookies={"access_token": self.cust_token})
        res_blocked = client_no_csrf.post("/accounts/acc-cust-001/freeze")
        self.assertEqual(res_blocked.status_code, 403)
        self.assertIn("CSRF", res_blocked.text)

        # Scenario B: Calling POST with cookie AND X-Requested-With header -> Allowed past CSRF check
        res_allowed = client_no_csrf.post(
            "/accounts/acc-cust-001/freeze",
            headers={"X-Requested-With": "XMLHttpRequest"}
        )
        self.assertNotEqual(res_allowed.status_code, 403)

        # Scenario C: Calling POST with cookie AND Origin header -> Allowed past CSRF check
        res_origin_allowed = client_no_csrf.post(
            "/accounts/acc-cust-001/unfreeze",
            headers={"Origin": "http://testserver"}
        )
        self.assertNotEqual(res_origin_allowed.status_code, 403)

    def test_02_enable_test_routes_false_blocks_diagnostics(self):
        """
        Verify that ENABLE_TEST_ROUTES=false gives 403 on /delay, /flaky, and /rate-limit.
        """
        from backend.app.core import config
        original_val = config.ENABLE_TEST_ROUTES
        try:
            config.ENABLE_TEST_ROUTES = False

            # Test /delay/1
            res_delay = self.client.get("/delay/1")
            self.assertEqual(res_delay.status_code, 403)
            self.assertIn("disabled", res_delay.text.lower())

            # Test /flaky
            res_flaky = self.client.get("/flaky")
            self.assertEqual(res_flaky.status_code, 403)
            self.assertIn("disabled", res_flaky.text.lower())

            # Test /rate-limit
            res_rate = self.client.get("/rate-limit")
            self.assertEqual(res_rate.status_code, 403)
            self.assertIn("disabled", res_rate.text.lower())
        finally:
            config.ENABLE_TEST_ROUTES = original_val

    def test_03_production_environment_hides_docs_and_redoc(self):
        """
        Verify that ENVIRONMENT=production hides /docs and /redoc (returns 404).
        """
        import backend.app.core.config as config_mod
        import backend.app.main as main_mod

        original_env = os.environ.get("ENVIRONMENT")
        try:
            os.environ["ENVIRONMENT"] = "production"
            importlib.reload(config_mod)
            importlib.reload(main_mod)

            prod_client = TestClient(main_mod.app)
            res_docs = prod_client.get("/docs")
            self.assertEqual(res_docs.status_code, 404)

            res_redoc = prod_client.get("/redoc")
            self.assertEqual(res_redoc.status_code, 404)

            res_openapi = prod_client.get("/openapi.json")
            self.assertEqual(res_openapi.status_code, 404)
        finally:
            if original_env is not None:
                os.environ["ENVIRONMENT"] = original_env
            else:
                os.environ.pop("ENVIRONMENT", None)
            importlib.reload(config_mod)
            importlib.reload(main_mod)

    def test_04_seed_demo_users_false_prevents_demo_seeding(self):
        """
        Verify that SEED_DEMO_USERS=false creates no demo users,
        and admin@bank.test cannot log in on a fresh database.
        """
        from backend.app.core import config as cfg_mod
        from backend.app.core import sql_db

        original_seed = os.environ.get("SEED_DEMO_USERS")
        original_db_path = sql_db.DB_PATH
        test_db_path = os.path.abspath("backend/data/test_unseeded.db")
        try:
            os.environ["SEED_DEMO_USERS"] = "false"
            importlib.reload(cfg_mod)
            importlib.reload(sql_db)

            if os.path.exists(test_db_path):
                os.remove(test_db_path)

            sql_db.DB_PATH = test_db_path
            sql_db.init_sql_database()

            conn = sql_db.get_db_connection()
            try:
                admin_count = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE email = 'admin@bank.test'").fetchone()["cnt"]
                total_users = conn.execute("SELECT COUNT(*) as cnt FROM users").fetchone()["cnt"]
            finally:
                conn.close()

            self.assertEqual(admin_count, 0, "admin@bank.test must not exist when SEED_DEMO_USERS=false")
            self.assertEqual(total_users, 0, "No demo users should be seeded when SEED_DEMO_USERS=false")

        finally:
            gc.collect()
            if os.path.exists(test_db_path):
                try:
                    os.remove(test_db_path)
                except Exception:
                    pass
            sql_db.DB_PATH = original_db_path
            if original_seed is not None:
                os.environ["SEED_DEMO_USERS"] = original_seed
            else:
                os.environ.pop("SEED_DEMO_USERS", None)
            importlib.reload(cfg_mod)
            importlib.reload(sql_db)


if __name__ == "__main__":
    unittest.main()
