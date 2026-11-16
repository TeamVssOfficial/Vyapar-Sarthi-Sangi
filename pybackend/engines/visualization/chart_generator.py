import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json

# Brand palette
COLORS = ["#14233D", "#E99A3A", "#31856C", "#748197", "#D97706", "#2563EB", "#059669", "#7C3AED"]


def generate_plotly_spec(df: pd.DataFrame, chart_type: str, x: str, y: str | None = None, color: str | None = None, title: str | None = None) -> dict:
    """
    Builds a Plotly JSON specification styled with the VSS AI brand theme.
    """
    fig = None

    if chart_type == "bar":
        if y:
            # Aggregate if x has duplicates
            agg_df = df.groupby(x, dropna=False)[y].sum().reset_index().sort_values(by=y, ascending=False).head(20)
            fig = px.bar(
                agg_df,
                x=x,
                y=y,
                title=title or f"{y} by {x}",
                color_discrete_sequence=[COLORS[0]]
            )
        else:
            counts = df[x].value_counts().reset_index().head(20)
            counts.columns = [x, "count"]
            fig = px.bar(
                counts,
                x=x,
                y="count",
                title=title or f"Count of {x}",
                color_discrete_sequence=[COLORS[0]]
            )

    elif chart_type == "stacked_bar":
        if y and color:
            agg_df = df.groupby([x, color], dropna=False)[y].sum().reset_index()
            fig = px.bar(
                agg_df,
                x=x,
                y=y,
                color=color,
                title=title or f"{y} by {x} and {color}",
                barmode="stack",
                color_discrete_sequence=COLORS
            )
        else:
            return generate_plotly_spec(df, "bar", x, y, title=title)

    elif chart_type == "line":
        if y:
            work = df[[x, y]].dropna().copy()
            # Sort by x
            work = work.sort_values(by=x)
            fig = px.line(
                work,
                x=x,
                y=y,
                title=title or f"{y} over {x}",
                color_discrete_sequence=[COLORS[1]],
                markers=True
            )

    elif chart_type == "scatter":
        if x and y:
            fig = px.scatter(
                df,
                x=x,
                y=y,
                color=color if color in df.columns else None,
                title=title or f"{y} vs {x}",
                color_discrete_sequence=COLORS,
                opacity=0.7
            )

    elif chart_type == "pie":
        if y:
            agg_df = df.groupby(x)[y].sum().reset_index().sort_values(by=y, ascending=False).head(8)
            fig = px.pie(
                agg_df,
                names=x,
                values=y,
                title=title or f"{y} Share by {x}",
                color_discrete_sequence=COLORS,
                hole=0.35
            )
        else:
            counts = df[x].value_counts().head(8).reset_index()
            counts.columns = [x, "count"]
            fig = px.pie(
                counts,
                names=x,
                values="count",
                title=title or f"{x} Distribution",
                color_discrete_sequence=COLORS,
                hole=0.35
            )

    elif chart_type == "histogram":
        fig = px.histogram(
            df,
            x=x,
            title=title or f"Distribution of {x}",
            color_discrete_sequence=[COLORS[2]],
            nbins=30
        )

    elif chart_type == "box":
        fig = px.box(
            df,
            y=y or x,
            x=x if y else None,
            title=title or f"Box Plot of {y or x}",
            color_discrete_sequence=[COLORS[0]]
        )

    elif chart_type == "correlation_heatmap":
        numeric_df = df.select_dtypes(include=np.number)
        corr = numeric_df.corr().round(2)
        fig = px.imshow(
            corr,
            text_auto=True,
            aspect="auto",
            color_continuous_scale="RdBu_r",
            title=title or "Correlation Heatmap"
        )

    if fig is None:
        raise ValueError(f"Unsupported chart configuration: type='{chart_type}', x='{x}', y='{y}'")

    fig.update_layout(
        paper_bgcolor="#FFFFFF",
        plot_bgcolor="#F9FAFB",
        font=dict(family="Inter, Segoe UI, sans-serif", size=12, color="#14233D"),
        margin=dict(l=40, r=40, t=60, b=40),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )

    return json.loads(fig.to_json())
