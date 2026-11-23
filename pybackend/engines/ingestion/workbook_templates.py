"""
Workbook Templates for Vyapar Excel Studio.
Pre-populated shopkeeper-friendly spreadsheet structures with headers, sample rows, and formulas.
"""

from typing import Dict, Any, List


def get_template(template_type: str) -> Dict[str, Any]:
    templates = {
        "blank": {
            "name": "Untitled Workbook",
            "sheets": [
                {
                    "name": "Sheet1",
                    "color": "#3B82F6",
                    "columns": ["A", "B", "C", "D", "E", "F", "G", "H"],
                    "data": [["" for _ in range(8)] for _ in range(25)]
                }
            ]
        },
        "sales_register": {
            "name": "Sales Register",
            "sheets": [
                {
                    "name": "Daily Sales",
                    "color": "#10B981",
                    "columns": ["Date", "Invoice_No", "Customer_Name", "Product_Item", "Category", "Quantity", "Unit_Price", "Total_Amount", "Payment_Mode"],
                    "data": [
                        ["2026-03-01", "INV-1001", "Sharma Mart", "Classic Basmati Rice 10kg", "Groceries", 15, 850.0, "=F2*G2", "UPI"],
                        ["2026-03-01", "INV-1002", "Verma Traders", "Mustard Oil 5L", "Edibles", 20, 720.0, "=F3*G3", "Cash"],
                        ["2026-03-02", "INV-1003", "Patel Brothers", "Chana Dal 1kg Pack", "Pulses", 50, 95.0, "=F4*G4", "Bank Transfer"],
                        ["2026-03-02", "INV-1004", "Rajeshwari Retail", "Sugar 5kg", "Groceries", 30, 220.0, "=F5*G5", "UPI"],
                        ["2026-03-03", "INV-1005", "Gupta Provision Store", "Wheat Flour 10kg", "Groceries", 40, 380.0, "=F6*G6", "Cheque"],
                        ["", "", "", "", "Total Sales:", "=SUM(F2:F6)", "", "=SUM(H2:H6)", ""]
                    ] + [["" for _ in range(9)] for _ in range(18)]
                }
            ]
        },
        "inventory_register": {
            "name": "Inventory Register",
            "sheets": [
                {
                    "name": "Stock Register",
                    "color": "#F59E0B",
                    "columns": ["Item_Code", "Item_Name", "Category", "Opening_Stock", "Inward_Qty", "Outward_Qty", "Current_Stock", "Reorder_Level", "Stock_Status"],
                    "data": [
                        ["SKU-001", "Basmati Rice 10kg", "Grains", 120, 50, 45, "=D2+E2-F2", 30, '=IF(G2<=H2,"LOW STOCK","OK")'],
                        ["SKU-002", "Mustard Oil 5L", "Oils", 60, 20, 55, "=D3+E3-F3", 25, '=IF(G3<=H3,"LOW STOCK","OK")'],
                        ["SKU-003", "Chana Dal 1kg", "Pulses", 200, 100, 120, "=D4+E4-F4", 50, '=IF(G4<=H4,"LOW STOCK","OK")'],
                        ["SKU-004", "Sugar 5kg", "Groceries", 90, 40, 85, "=D5+E5-F5", 40, '=IF(G5<=H5,"LOW STOCK","OK")'],
                        ["SKU-005", "Atta 10kg", "Flour", 150, 60, 90, "=D6+E6-F6", 50, '=IF(G6<=H6,"LOW STOCK","OK")'],
                        ["", "Total Units in Stock:", "", "=SUM(D2:D6)", "=SUM(E2:E6)", "=SUM(F2:F6)", "=SUM(G2:G6)", "", ""]
                    ] + [["" for _ in range(9)] for _ in range(18)]
                }
            ]
        },
        "expense_tracker": {
            "name": "Expense Tracker",
            "sheets": [
                {
                    "name": "Operating Expenses",
                    "color": "#EF4444",
                    "columns": ["Date", "Expense_Category", "Description", "Vendor_Payee", "Amount", "Payment_Mode", "GST_Applicable", "Voucher_No"],
                    "data": [
                        ["2026-03-01", "Shop Rent", "Monthly Shop Lease", "R.K. Properties", 25000.0, "Bank Transfer", "No", "V-101"],
                        ["2026-03-02", "Electricity", "Commercial Power Bill", "State Power Corp", 4850.0, "Online Bill", "Yes", "V-102"],
                        ["2026-03-03", "Logistics", "Goods Transport Tempo", "Express Logistics", 3200.0, "Cash", "No", "V-103"],
                        ["2026-03-04", "Packaging", "Cardboard boxes & tape", "Shree Packaging", 1850.0, "UPI", "Yes", "V-104"],
                        ["2026-03-05", "Staff Wages", "Sales Staff Weekly", "Mohan & Team", 8000.0, "Cash", "No", "V-105"],
                        ["", "Total Expenses:", "", "", "=SUM(E2:E6)", "", "", ""]
                    ] + [["" for _ in range(8)] for _ in range(18)]
                }
            ]
        },
        "purchase_register": {
            "name": "Purchase Register",
            "sheets": [
                {
                    "name": "Inward Purchases",
                    "color": "#8B5CF6",
                    "columns": ["Date", "PO_Number", "Supplier_Name", "Item_Purchased", "Quantity", "Unit_Cost", "Tax_Pct", "Total_Cost", "Payment_Due_Date"],
                    "data": [
                        ["2026-03-01", "PO-501", "Agro Foods Ltd", "Basmati Rice 10kg", 50, 720.0, 5, "=E2*F2*(1+G2/100)", "2026-03-25"],
                        ["2026-03-02", "PO-502", "Bharat Mills", "Mustard Oil Cans", 30, 610.0, 5, "=E3*F3*(1+G3/100)", "2026-03-20"],
                        ["2026-03-03", "PO-503", "Kisan Pulses Mandi", "Chana Dal Bags", 100, 78.0, 0, "=E4*F4*(1+G4/100)", "2026-03-15"],
                        ["", "", "Total Purchases:", "", "=SUM(E2:E4)", "", "", "=SUM(H2:H4)", ""]
                    ] + [["" for _ in range(9)] for _ in range(18)]
                }
            ]
        },
        "customer_database": {
            "name": "Customer Database",
            "sheets": [
                {
                    "name": "Customer Directory",
                    "color": "#06B6D4",
                    "columns": ["Customer_ID", "Full_Name", "Phone_Number", "City", "GSTIN", "Total_Purchases", "Outstanding_Balance", "Credit_Status"],
                    "data": [
                        ["CUST-001", "Sharma Mart", "9876543210", "Surat", "24AAAAA0000A1Z5", 85000.0, 12000.0, '=IF(G2>0,"DUE","CLEARED")'],
                        ["CUST-002", "Verma Traders", "9823456789", "Ahmedabad", "24BBBBB1111B1Z2", 64000.0, 0.0, '=IF(G3>0,"DUE","CLEARED")'],
                        ["CUST-003", "Patel Brothers", "9812345678", "Vadodara", "24CCCCC2222C1Z8", 120000.0, 25000.0, '=IF(G4>0,"DUE","CLEARED")'],
                        ["CUST-004", "Rajeshwari Retail", "9898765432", "Rajkot", "24DDDDD3333D1Z4", 42000.0, 0.0, '=IF(G5>0,"DUE","CLEARED")'],
                        ["", "Total Ledger:", "", "", "", "=SUM(F2:F5)", "=SUM(G2:G5)", ""]
                    ] + [["" for _ in range(8)] for _ in range(18)]
                }
            ]
        },
        "business_budget": {
            "name": "Business Budget",
            "sheets": [
                {
                    "name": "Quarterly Budget",
                    "color": "#14B8A6",
                    "columns": ["Budget_Category", "Planned_Amount", "Actual_Spent", "Variance", "Status_Notes"],
                    "data": [
                        ["Shop Rent & Maintenance", 80000.0, 75000.0, "=B2-C2", "Within Budget"],
                        ["Inventory Procurement", 450000.0, 480000.0, "=B3-C3", "Over Budget"],
                        ["Utilities & Electricity", 20000.0, 18500.0, "=B4-C4", "Savings"],
                        ["Marketing & Pamphlets", 15000.0, 12000.0, "=B5-C5", "Savings"],
                        ["Staff Salary & Overtime", 60000.0, 62000.0, "=B6-C6", "Minor Over"],
                        ["Total Budget:", "=SUM(B2:B6)", "=SUM(C2:C6)", "=SUM(D2:D6)", ""]
                    ] + [["" for _ in range(5)] for _ in range(18)]
                }
            ]
        },
        "invoice_register": {
            "name": "Invoice Register",
            "sheets": [
                {
                    "name": "GST Invoices",
                    "color": "#EC4899",
                    "columns": ["Invoice_Date", "Invoice_No", "Customer_Name", "Taxable_Value", "CGST_Pct", "SGST_Pct", "Total_Tax", "Grand_Total", "Payment_Status"],
                    "data": [
                        ["2026-03-01", "GST-01", "Singhania Wholesalers", 45000.0, 2.5, 2.5, "=D2*(E2+F2)/100", "=D2+G2", "Paid"],
                        ["2026-03-02", "GST-02", "Mehta Supermarket", 62000.0, 2.5, 2.5, "=D3*(E3+F3)/100", "=D3+G3", "Pending"],
                        ["2026-03-03", "GST-03", "Apex Retailers", 28000.0, 9.0, 9.0, "=D4*(E4+F4)/100", "=D4+G4", "Paid"],
                        ["", "Total Billing:", "", "=SUM(D2:D4)", "", "", "=SUM(G2:G4)", "=SUM(H2:H4)", ""]
                    ] + [["" for _ in range(9)] for _ in range(18)]
                }
            ]
        }
    }
    return templates.get(template_type, templates["blank"])
