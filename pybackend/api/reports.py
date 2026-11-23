from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pathlib import Path
import uuid
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, UserBusiness, Dataset, Report, AuditLog
from auth.dependencies import get_current_user, get_current_business
from auth.subscription_guard import require_active_subscription
from config import settings
from api.datasets import load_dataset_df
from engines.data_intelligence.profiling import profile_dataset
from engines.bi.kpi_calculator import calculate_business_kpis
from engines.reports.pdf_generator import generate_executive_pdf
from engines.reports.excel_generator import generate_excel_report

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])

REPORTS_DIR = settings.STORAGE_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


class GenerateReportRequest(BaseModel):
    report_type: str = Field(..., description="'pdf' or 'excel'")
    title: Optional[str] = None
    theme: Optional[str] = "light"  # 'light' or 'dark'
    language: Optional[str] = "bilingual"  # 'bilingual', 'en', 'hi'
    include_charts: Optional[bool] = True


@router.post("/{dataset_id}/generate")
def generate_report_endpoint(
    dataset_id: str,
    req: GenerateReportRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _sub: Any = Depends(require_active_subscription)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    profile = profile_dataset(df)
    kpis = calculate_business_kpis(df)

    report_id = str(uuid.uuid4())
    rtype = req.report_type.lower()
    title = req.title or f"{dataset.name} {rtype.upper()} Intelligence Report"

    if rtype == "pdf":
        file_path = REPORTS_DIR / f"{report_id}.pdf"
        generate_executive_pdf(
            output_path=file_path,
            dataset_name=dataset.name,
            business_name=business.name,
            overview_data=profile,
            kpis_data=kpis,
            quality_data=profile,
            theme=req.theme or "light",
            language=req.language or "bilingual",
            include_charts=req.include_charts if req.include_charts is not None else True,
            df=df
        )
    elif rtype == "excel":
        file_path = REPORTS_DIR / f"{report_id}.xlsx"
        generate_excel_report(
            output_path=file_path,
            df=df,
            profile_data=profile,
            kpis_data=kpis
        )
    else:
        raise HTTPException(status_code=400, detail="report_type must be either 'pdf' or 'excel'")

    db_report = Report(
        id=report_id,
        business_id=business.id,
        dataset_id=dataset.id,
        title=title,
        report_type=rtype,
        file_path=str(file_path.resolve())
    )
    db.add(db_report)
    db.add(AuditLog(
        user_id=user.id,
        business_id=business.id,
        action="generate_report",
        details=f"Generated {rtype.upper()} report '{title}' for dataset '{dataset.name}'"
    ))
    db.commit()

    return {
        "report_id": report_id,
        "title": title,
        "report_type": rtype,
        "filename": file_path.name,
        "download_url": f"/api/reports/{report_id}/download"
    }


@router.get("/{dataset_id}")
def list_reports(
    dataset_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).filter(
        Report.dataset_id == dataset_id,
        Report.business_id == business.id
    ).order_by(Report.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "created_at": r.created_at.isoformat(),
            "download_url": f"/api/reports/{r.id}/download"
        }
        for r in reports
    ]


@router.get("/{report_id}/download")
def download_report_file(
    report_id: str,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Authorize access: active business, or user belongs to report's business, or admin
    if report.business_id != business.id and user.role != "admin":
        membership = db.query(UserBusiness).filter(
            UserBusiness.user_id == user.id,
            UserBusiness.business_id == report.business_id
        ).first()
        if not membership and getattr(business, "owner_id", None) != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this report")

    path = Path(report.file_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    media_type = "application/pdf" if report.report_type == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = f"{report.title}.{path.suffix.lstrip('.')}"

    return FileResponse(
        path=path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
