"""
NeoBank Baseline Regression Test Suite
======================================
Verifies that all legitimate working features, endpoints, auth flows,
data structures, and banking operations pass BEFORE and AFTER any security fix.
"""
import os
import unittest
from starlette.testclient import TestClient

os.environ["ENVIRONMENT"] = "development"
os.environ["JWT_SECRET"] = "c717bfbbbb7b24d10c5be5899cfe2f9af7417f1e252279dcc1411d794a4d0cf6"
os.environ["NEOBANK_DOC_KEY"] = "u1z6Qci_7ZZl6RIHIaKkQS-um5A1MRxB6ZdbcegO4cM="
os.environ["POS_GATEWAY_KEY"] = "c68a4caf2261e0afac78effe4afbf90e563680c60f627bffc79dbdf5caeb97f6"

from backend.app.main import app
from backend.app.core.database import DB, reset_db
from backend.app.core.limiter import limiter


class TestNeoBankBaselineRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Disable rate limiting specifically for automated integration testing
        limiter.enabled = False
        app.state.limiter.enabled = False
        cls.client = TestClient(app)
        reset_db()

        # Pre-authenticate customer and admin sessions for test efficiency
        cls.admin_token = cls.client.post("/auth/login", json={
            "email": "admin@bank.test",
            "password": "Admin@1234"
        }).json()["accessToken"]

        cls.cust_token = cls.client.post("/auth/login", json={
            "email": "customer@bank.test",
            "password": "Customer@1234"
        }).json()["accessToken"]

    def test_01_system_health(self):
        """Verify system health endpoint returns operational status."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "UP")

    def test_02_customer_registration_and_login(self):
        """Verify new customer registration and subsequent login."""
        unique_email = f"baseline_user_{os.urandom(4).hex()}@bank.test"
        reg_payload = {
            "email": unique_email,
            "password": "Password@12345",
            "profile": {
                "firstName": "Arthur",
                "lastName": "Dent",
                "dob": "1992-05-10",
                "phone": "+447700900999",
                "address": {
                    "line1": "42 Galaxy Way",
                    "city": "London",
                    "postalCode": "SW1A 1AA",
                    "country": "GB"
                }
            },
            "marketingConsent": False,
            "preferences": {"currency": "USD"}
        }
        res = self.client.post("/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("accessToken", data)
        self.assertEqual(data.get("role"), "CUSTOMER")

        # Login via JSON /auth/login
        login_res = self.client.post("/auth/login", json={
            "email": unique_email,
            "password": "Password@12345"
        })
        self.assertEqual(login_res.status_code, 200)
        token_data = login_res.json()
        self.assertIn("accessToken", token_data)

    def test_03_admin_and_customer_login(self):
        """Verify seeded Admin and Customer can authenticate successfully."""
        self.assertIsNotNone(self.admin_token)
        self.assertIsNotNone(self.cust_token)

    def test_04_onboarding_lifecycle(self):
        """Verify onboarding catalog, draft initiation, draft retrieval, and application tracking."""
        # 1. Catalog
        cat_res = self.client.get("/onboarding/account-types")
        self.assertEqual(cat_res.status_code, 200)
        catalog = cat_res.json()
        self.assertIsInstance(catalog, list)
        self.assertTrue(len(catalog) > 0)

        # 2. Initiate Draft
        draft_payload = {
            "accountType": "SAVINGS",
            "branchName": "Central Branch",
            "branchCode": "CB01"
        }
        init_res = self.client.post("/onboarding/initiate-draft", json=draft_payload)
        self.assertEqual(init_res.status_code, 200)
        draft_data = init_res.json()
        app_num = draft_data.get("applicationNumber")
        draft_sec = draft_data.get("draftSecret")
        self.assertIsNotNone(app_num)
        self.assertTrue(app_num.startswith("APP-"))

        # 3. Save Draft
        save_payload = {
            "applicationNumber": app_num,
            "draftSecret": draft_sec,
            "accountType": "SAVINGS",
            "applicant": {
                "firstName": "Arthur",
                "lastName": "Dent",
                "email": "arthur@example.test"
            },
            "formData": {"step": 2, "declaredIncome": 50000}
        }
        save_res = self.client.post("/onboarding/save-draft", json=save_payload)
        self.assertEqual(save_res.status_code, 200)

        # 4. Track Application
        track_res = self.client.get(f"/onboarding/track/{app_num}")
        self.assertEqual(track_res.status_code, 200)
        track_data = track_res.json()
        self.assertEqual(track_data.get("applicationNumber"), app_num)

    def test_05_staff_applications_queue(self):
        """Verify staff portal lists submitted applications."""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        res = self.client.get("/onboarding/applications", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("data", data)

    def test_06_accounts_and_balances(self):
        """Verify accounts listing and balance query for customer."""
        headers = {"Authorization": f"Bearer {self.cust_token}"}
        res = self.client.get("/accounts", headers=headers)
        self.assertEqual(res.status_code, 200)
        accounts_data = res.json()
        self.assertIn("data", accounts_data)
        if accounts_data["data"]:
            acc_id = accounts_data["data"][0]["id"]
            bal_res = self.client.get(f"/accounts/{acc_id}/balance", headers=headers)
            self.assertEqual(bal_res.status_code, 200)
            self.assertIn("balance", bal_res.json())

    def test_07_cards_listing(self):
        """Verify card retrieval for active customer."""
        headers = {"Authorization": f"Bearer {self.cust_token}"}
        res = self.client.get("/cards", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_08_loans_quote_generation(self):
        """Verify loan quote calculation."""
        headers = {"Authorization": f"Bearer {self.cust_token}"}
        quote_payload = {
            "amount": 10000.0,
            "termMonths": 24,
            "purpose": "PERSONAL",
            "currency": "USD"
        }
        res = self.client.post("/loans/quotes", json=quote_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("quoteId", data)
        self.assertIn("monthlyPayment", data)
        self.assertIn("apr", data)


if __name__ == "__main__":
    unittest.main()
