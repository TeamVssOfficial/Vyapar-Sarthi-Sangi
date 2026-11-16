import unittest
import os
import sys
from pathlib import Path

# Add pybackend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from starlette.testclient import TestClient
from main import app, init_db

client = TestClient(app)


class TestVSSAIPlatform(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure fresh tables
        init_db()
        cls.test_email = f"lead_architect_{os.getpid()}@vssai.com"
        cls.test_password = "SecurePassword2026!"
        cls.token = None
        cls.business_id = None
        cls.dataset_id = None

    def test_01_health_and_root(self):
        print("\n[TEST] 01 Running health and root check...")
        resp = client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["short_name"], "VSS AI")

        resp_health = client.get("/health")
        self.assertEqual(resp_health.status_code, 200)
        self.assertEqual(resp_health.json()["status"], "healthy")
        print("[TEST] 01 PASSED")

    def test_02_auth_register_and_login(self):
        print("\n[TEST] 02 Running auth register & login...")
        reg_payload = {
            "name": "Arjun Sharma",
            "email": self.test_email,
            "password": self.test_password,
            "business_name": "Sharma Enterprise Solutions",
            "industry": "Retail & Distribution"
        }
        res = client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("token", data)
        self.__class__.token = data["token"]
        self.__class__.business_id = data["business"]["id"]

        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.json()["user"]["email"], self.test_email)

        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["user"]["name"], "Arjun Sharma")
        print("[TEST] 02 PASSED")

    def test_03_business_workspace(self):
        print("\n[TEST] 03 Running business workspace check...")
        headers = {"Authorization": f"Bearer {self.token}"}
        res = client.get("/api/businesses/", headers=headers)
        self.assertEqual(res.status_code, 200)
        businesses = res.json()
        self.assertTrue(len(businesses) >= 1)
        self.assertEqual(businesses[0]["name"], "Sharma Enterprise Solutions")
        print("[TEST] 03 PASSED")

    def test_04_dataset_upload_and_preview(self):
        print("\n[TEST] 04 Running dataset upload & preview...")
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        sample_path = BACKEND_DIR.parent / "notebooks" / "sales_data_sample.csv"
        self.assertTrue(sample_path.is_file(), f"Sample file not found at {sample_path}")

        with open(sample_path, "rb") as f:
            res = client.post(
                "/api/upload/",
                headers=headers,
                files={"file": ("sales_data_sample.csv", f, "text/csv")},
                data={"name": "Sales Benchmark Data"}
            )

        self.assertEqual(res.status_code, 201)
        upload_data = res.json()
        self.assertIn("dataset_id", upload_data)
        self.__class__.dataset_id = upload_data["dataset_id"]
        self.assertEqual(upload_data["row_count"], 2823)

        # Preview
        preview_res = client.get(f"/api/datasets/{self.dataset_id}", headers=headers)
        self.assertEqual(preview_res.status_code, 200)
        p_data = preview_res.json()
        self.assertEqual(len(p_data["preview"]), 50)
        self.assertIn("SALES", p_data["columns"])
        print("[TEST] 04 PASSED")

    def test_05_data_quality_and_cleaning(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        res = client.get(f"/api/data-quality/{self.dataset_id}", headers=headers)
        self.assertEqual(res.status_code, 200)
        q_data = res.json()
        self.assertIn("quality_score", q_data["profile"])
        self.assertIn("recommendations", q_data)

        # Clean dataset safely
        clean_res = client.post(
            f"/api/data-quality/{self.dataset_id}/clean",
            headers=headers,
            json={
                "drop_duplicates": True,
                "trim_whitespace": True,
                "fill_numeric_strategy": "median",
                "fill_categorical_strategy": "unknown",
                "cleaned_name": "Sales Benchmark Data Cleaned"
            }
        )
        self.assertEqual(clean_res.status_code, 200)
        c_data = clean_res.json()
        self.assertIn("new_dataset_id", c_data)

    def test_06_eda_engine(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        res = client.get(f"/api/analysis/{self.dataset_id}/eda", headers=headers)
        self.assertEqual(res.status_code, 200)
        eda = res.json()
        self.assertIn("descriptive_statistics", eda)
        self.assertIn("correlations", eda)
        self.assertIn("outliers", eda)
        self.assertTrue(eda["correlations"]["has_correlation"])

    def test_07_business_intelligence_kpis(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        res = client.get(f"/api/bi/{self.dataset_id}/kpis", headers=headers)
        self.assertEqual(res.status_code, 200)
        kpis = res.json()
        headline = kpis["headline_metrics"]
        self.assertGreater(headline["total_revenue"], 1000000)
        self.assertGreater(len(kpis["category_breakdown"]), 0)
        self.assertGreater(len(kpis["customer_performance"]), 0)

    def test_08_charts_engine(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        # Bar chart
        res = client.get(
            f"/api/charts/{self.dataset_id}/spec?chart_type=bar&x=PRODUCTLINE&y=SALES&title=Sales+by+Line",
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        spec = res.json()
        self.assertIn("data", spec)
        self.assertIn("layout", spec)

        # Dashboard presets
        presets_res = client.get(f"/api/charts/{self.dataset_id}/dashboard-presets", headers=headers)
        self.assertEqual(presets_res.status_code, 200)
        self.assertGreater(len(presets_res.json()["charts"]), 0)

    def test_09_ml_studio(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        # Tasks detection
        tasks_res = client.get(f"/api/ml/{self.dataset_id}/tasks", headers=headers)
        self.assertEqual(tasks_res.status_code, 200)
        tasks = tasks_res.json()["suggestions"]
        self.assertGreater(len(tasks), 0)

        # Train regression model
        train_res = client.post(
            f"/api/ml/{self.dataset_id}/train",
            headers=headers,
            json={
                "task_type": "regression",
                "target_column": "SALES",
                "name": "Random Forest Sales Predictor"
            }
        )
        self.assertEqual(train_res.status_code, 200)
        m_data = train_res.json()
        self.assertIn("model_id", m_data)
        self.assertIn("r2_score", m_data["metrics"])

        # Train time-series forecast
        forecast_res = client.post(
            f"/api/ml/{self.dataset_id}/train",
            headers=headers,
            json={
                "task_type": "forecasting",
                "date_column": "ORDERDATE",
                "target_column": "SALES",
                "forecast_horizon": 3
            }
        )
        self.assertEqual(forecast_res.status_code, 200)
        self.assertEqual(len(forecast_res.json()["forecast"]), 3)

    def test_10_ai_analyst(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        chat_res = client.post(
            f"/api/ai/{self.dataset_id}/ask",
            headers=headers,
            json={"question": "What is our total sales volume and which product category performs best?"}
        )
        self.assertEqual(chat_res.status_code, 200)
        c_data = chat_res.json()
        self.assertIn("answer", c_data)
        self.assertIn("suggested_actions", c_data)
        self.assertIn("evidence", c_data)

    def test_11_reports_generation(self):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Business-Id": self.business_id
        }
        # Generate PDF report
        pdf_res = client.post(
            f"/api/reports/{self.dataset_id}/generate",
            headers=headers,
            json={"report_type": "pdf", "title": "Quarterly Intelligence Brief"}
        )
        self.assertEqual(pdf_res.status_code, 200)
        rep_data = pdf_res.json()
        self.assertEqual(rep_data["report_type"], "pdf")

        # Download PDF
        dl_res = client.get(rep_data["download_url"], headers=headers)
        self.assertEqual(dl_res.status_code, 200)
        self.assertEqual(dl_res.headers["content-type"], "application/pdf")
        self.assertGreater(len(dl_res.content), 1000)

        # Generate Excel report
        excel_res = client.post(
            f"/api/reports/{self.dataset_id}/generate",
            headers=headers,
            json={"report_type": "excel", "title": "Comprehensive Excel Audit"}
        )
        self.assertEqual(excel_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
