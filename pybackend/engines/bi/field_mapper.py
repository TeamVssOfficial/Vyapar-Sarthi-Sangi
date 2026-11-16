import pandas as pd


def detect_business_mapping(df: pd.DataFrame, user_mapping: dict | None = None) -> dict:
    """
    Identifies semantic business fields across dimensions and metrics.
    Allows user override mapping.
    """
    mapping = {
        # Metrics
        "revenue": None,
        "sales": None,
        "quantity": None,
        "profit": None,
        "cost": None,
        "price": None,
        "discount": None,
        # Dimensions
        "date": None,
        "product": None,
        "category": None,
        "customer": None,
        "region": None,
        "country": None,
        "order_id": None,
        "status": None
    }

    cols = df.columns.tolist()
    col_lowers = {str(c).lower().replace(" ", "").replace("_", ""): str(c) for c in cols}

    # Helper to check keywords in column name
    def find_match(keywords: list[str], must_be_numeric: bool = True) -> str | None:
        for kw in keywords:
            for clean_name, orig in col_lowers.items():
                if kw in clean_name:
                    if must_be_numeric:
                        if pd.api.types.is_numeric_dtype(df[orig]):
                            return orig
                    else:
                        return orig
        return None

    # Detect metrics
    mapping["sales"] = find_match(["sales", "saleamount", "totalsales", "turnover"])
    mapping["revenue"] = find_match(["revenue", "totalrevenue", "grossrevenue", "incometotal"]) or mapping["sales"]
    mapping["quantity"] = find_match(["quantityordered", "quantity", "qty", "units", "unitssold", "orderqty"])
    mapping["profit"] = find_match(["profit", "netprofit", "marginamount", "gain"])
    mapping["cost"] = find_match(["cost", "totalcost", "cogs", "expense"])
    mapping["price"] = find_match(["priceeach", "unitprice", "price", "rate", "msrp"])
    mapping["discount"] = find_match(["discount", "discountamount", "rebate"])

    # Detect dimensions
    for clean_name, orig in col_lowers.items():
        if any(k in clean_name for k in ["orderdate", "transactiondate", "invoicedate", "salesdate", "date", "createdat"]):
            mapping["date"] = orig
            break

    mapping["product"] = find_match(["productname", "productcode", "itemname", "itemcode", "sku", "product"], must_be_numeric=False)
    mapping["category"] = find_match(["productline", "category", "productcategory", "line", "department", "genre"], must_be_numeric=False)
    mapping["customer"] = find_match(["customername", "clientname", "customer", "accountname", "buyer"], must_be_numeric=False)
    mapping["country"] = find_match(["country", "nation"], must_be_numeric=False)
    mapping["region"] = find_match(["territory", "state", "region", "province", "zone"], must_be_numeric=False)
    mapping["order_id"] = find_match(["ordernumber", "orderid", "invoicenumber", "invoiceid", "transactionid"], must_be_numeric=False)
    mapping["status"] = find_match(["status", "orderstatus", "stage", "state"], must_be_numeric=False)

    # Apply user overrides if specified
    if user_mapping:
        for k, v in user_mapping.items():
            if k in mapping and (v is None or v in cols):
                mapping[k] = v

    # Capability summary
    capabilities = {
        "can_revenue_analysis": bool(mapping["revenue"] or mapping["sales"]),
        "can_time_series": bool((mapping["revenue"] or mapping["sales"]) and mapping["date"]),
        "can_product_analysis": bool((mapping["revenue"] or mapping["sales"] or mapping["quantity"]) and (mapping["product"] or mapping["category"])),
        "can_customer_analysis": bool((mapping["revenue"] or mapping["sales"]) and mapping["customer"]),
        "can_geographic_analysis": bool((mapping["revenue"] or mapping["sales"]) and (mapping["country"] or mapping["region"])),
        "can_profit_analysis": bool(mapping["profit"] or (mapping["revenue"] and mapping["cost"]))
    }

    return {
        "mapping": mapping,
        "capabilities": capabilities,
        "available_columns": cols
    }
