// VSS AI - Zero-Dependency Native SVG Chart Renderer
// Guarantees 100% chart uptime with instant rendering, zero network lag, and rich visual appeal.

export function renderSVGBarChart(containerId, { labels = [], values = [], title = "", color = "#E99A3A" }) {
  const el = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (!el || !labels.length || !values.length) return;

  const width = el.clientWidth || 520;
  const height = el.clientHeight || 260;
  const padLeft = 55;
  const padBottom = 45;
  const padTop = 30;
  const padRight = 20;

  const chartW = Math.max(100, width - padLeft - padRight);
  const chartH = Math.max(80, height - padTop - padBottom);

  const numVals = values.map(v => Number(v) || 0);
  const maxVal = Math.max(...numVals, 1) * 1.12;

  const barCount = labels.length;
  const barGap = Math.max(4, Math.min(18, (chartW / barCount) * 0.25));
  const barWidth = Math.max(12, (chartW - (barCount - 1) * barGap) / barCount);

  // Grid lines
  const gridCount = 4;
  let gridLines = "";
  for (let i = 0; i <= gridCount; i++) {
    const yVal = (maxVal / gridCount) * i;
    const yPos = padTop + chartH - (yVal / maxVal) * chartH;
    const formattedY = yVal >= 1000000 ? (yVal / 1000000).toFixed(1) + "M" : (yVal >= 1000 ? (yVal / 1000).toFixed(0) + "k" : yVal.toFixed(0));
    gridLines += `
      <line x1="${padLeft}" y1="${yPos}" x2="${padLeft + chartW}" y2="${yPos}" stroke="#E2E8F0" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${padLeft - 8}" y="${yPos + 4}" font-size="10" font-family="sans-serif" fill="#94A3B8" text-anchor="end">${formattedY}</text>
    `;
  }

  // Bars
  let bars = "";
  labels.forEach((label, idx) => {
    const val = numVals[idx];
    const bHeight = Math.max(2, (val / maxVal) * chartH);
    const xPos = padLeft + idx * (barWidth + barGap);
    const yPos = padTop + chartH - bHeight;

    const shortLabel = label.length > 12 ? label.substring(0, 10) + "…" : label;
    const valFormatted = val >= 1000000 ? "₹" + (val / 1000000).toFixed(1) + "M" : (val >= 1000 ? "₹" + (val / 1000).toFixed(1) + "k" : "₹" + val.toFixed(0));

    bars += `
      <g class="svg-bar-group" style="cursor: pointer;">
        <defs>
          <linearGradient id="barGrad-${idx}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" />
            <stop offset="100%" stop-color="#14233D" stop-opacity="0.85" />
          </linearGradient>
        </defs>
        <rect x="${xPos}" y="${yPos}" width="${barWidth}" height="${bHeight}" rx="4" fill="url(#barGrad-${idx})">
          <title>${label}: ${valFormatted}</title>
        </rect>
        <text x="${xPos + barWidth / 2}" y="${yPos - 6}" font-size="9" font-weight="700" font-family="sans-serif" fill="#14233D" text-anchor="middle">${valFormatted}</text>
        <text x="${xPos + barWidth / 2}" y="${padTop + chartH + 16}" font-size="10" font-weight="500" font-family="sans-serif" fill="#64748B" text-anchor="middle" transform="rotate(${barCount > 6 ? 25 : 0}, ${xPos + barWidth / 2}, ${padTop + chartH + 16})">${shortLabel}</text>
      </g>
    `;
  });

  el.innerHTML = `
    <div style="width: 100%; height: 100%; position: relative;">
      ${title ? `<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #748197; margin-bottom: 4px; letter-spacing: 0.5px;">${title}</div>` : ''}
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        ${gridLines}
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${padLeft + chartW}" y2="${padTop + chartH}" stroke="#CBD5E1" stroke-width="1.5" />
        ${bars}
      </svg>
    </div>
  `;
}

export function renderSVGLineChart(containerId, { labels = [], values = [], title = "", color = "#E99A3A" }) {
  const el = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (!el || !labels.length || !values.length) return;

  const width = el.clientWidth || 520;
  const height = el.clientHeight || 260;
  const padLeft = 55;
  const padBottom = 40;
  const padTop = 30;
  const padRight = 20;

  const chartW = Math.max(100, width - padLeft - padRight);
  const chartH = Math.max(80, height - padTop - padBottom);

  const numVals = values.map(v => Number(v) || 0);
  const maxVal = Math.max(...numVals, 1) * 1.15;
  const minVal = Math.min(...numVals, 0);

  const count = labels.length;
  const stepX = count > 1 ? chartW / (count - 1) : chartW / 2;

  // Grid
  let gridLines = "";
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const yVal = (maxVal / gridCount) * i;
    const yPos = padTop + chartH - (yVal / maxVal) * chartH;
    const formattedY = yVal >= 1000000 ? (yVal / 1000000).toFixed(1) + "M" : (yVal >= 1000 ? (yVal / 1000).toFixed(0) + "k" : yVal.toFixed(0));
    gridLines += `
      <line x1="${padLeft}" y1="${yPos}" x2="${padLeft + chartW}" y2="${yPos}" stroke="#E2E8F0" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${padLeft - 8}" y="${yPos + 4}" font-size="10" font-family="sans-serif" fill="#94A3B8" text-anchor="end">${formattedY}</text>
    `;
  }

  // Points & Path
  let points = [];
  labels.forEach((label, idx) => {
    const val = numVals[idx];
    const x = padLeft + idx * stepX;
    const y = padTop + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
    points.push({ x, y, label, val });
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  // Dots
  let dots = "";
  points.forEach((p, idx) => {
    const valFormatted = p.val >= 1000000 ? "₹" + (p.val / 1000000).toFixed(1) + "M" : (p.val >= 1000 ? "₹" + (p.val / 1000).toFixed(0) + "k" : "₹" + p.val.toFixed(0));
    dots += `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#FFFFFF" stroke="${color}" stroke-width="2.5" style="cursor: pointer;">
          <title>${p.label}: ${valFormatted}</title>
        </circle>
        <text x="${p.x}" y="${padTop + chartH + 16}" font-size="10" font-family="sans-serif" fill="#64748B" text-anchor="middle">${p.label}</text>
      </g>
    `;
  });

  el.innerHTML = `
    <div style="width: 100%; height: 100%; position: relative;">
      ${title ? `<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #748197; margin-bottom: 4px; letter-spacing: 0.5px;">${title}</div>` : ''}
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.25" />
            <stop offset="100%" stop-color="${color}" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaD}" fill="url(#areaGrad)" />
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${padLeft + chartW}" y2="${padTop + chartH}" stroke="#CBD5E1" stroke-width="1.5" />
        ${dots}
      </svg>
    </div>
  `;
}

export function renderSVGPieChart(containerId, { labels = [], values = [], title = "" }) {
  const el = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (!el || !labels.length || !values.length) return;

  const width = el.clientWidth || 400;
  const height = el.clientHeight || 260;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = Math.min(width, height) / 2.6;
  const innerRadius = radius * 0.55;

  const numVals = values.map(v => Number(v) || 0);
  const total = numVals.reduce((a, b) => a + b, 0) || 1;
  const colors = ["#E99A3A", "#10B981", "#6366F1", "#0EA5E9", "#EC4899", "#F59E0B", "#14233D", "#8B5CF6"];

  let cumulativeAngle = 0;
  let paths = "";

  labels.forEach((label, i) => {
    const val = numVals[i];
    const sliceAngle = (val / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const color = colors[i % colors.length];

    paths += `
      <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z" fill="${color}" stroke="#FFFFFF" stroke-width="2" style="cursor: pointer;">
        <title>${label}: ${val.toLocaleString()} (${((val / total) * 100).toFixed(1)}%)</title>
      </path>
    `;
  });

  el.innerHTML = `
    <div style="width: 100%; height: 100%; position: relative; text-align: center;">
      ${title ? `<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #748197; margin-bottom: 4px;">${title}</div>` : ''}
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        ${paths}
        <text x="${cx}" y="${cy - 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#14233D">Total</text>
        <text x="${cx}" y="${cy + 14}" font-size="11" text-anchor="middle" fill="#64748B">${total >= 1000000 ? (total / 1000000).toFixed(1) + 'M' : total.toLocaleString()}</text>
      </svg>
    </div>
  `;
}

export function autoRenderSpec(containerId, spec, title = "") {
  if (!spec || !spec.data || !spec.data.length) return;
  const trace = spec.data[0];
  const chartType = trace.type || "bar";
  const x = trace.x || [];
  const y = trace.y || [];

  if (chartType === "scatter" || chartType === "line") {
    renderSVGLineChart(containerId, { labels: x, values: y, title: title || spec.layout?.title?.text || "Trend Analysis", color: "#E99A3A" });
  } else {
    renderSVGBarChart(containerId, { labels: x, values: y, title: title || spec.layout?.title?.text || "Commercial Breakdown", color: "#14233D" });
  }
}
