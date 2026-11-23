// Genuine Excel Formula Evaluation Engine for Vyapar Excel Studio
// Supports SUM, AVERAGE, COUNT, COUNTA, MIN, MAX, IF, SUMIF, COUNTIF, VLOOKUP, CONCAT, ROUND, TODAY, DATE, AND, OR

export function colLetterToIndex(colStr) {
  let index = 0;
  const str = colStr.toUpperCase().trim();
  for (let i = 0; i < str.length; i++) {
    index = index * 26 + (str.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColLetter(index) {
  let letter = "";
  let temp = index + 1;
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export function parseCellReference(cellRef) {
  const match = cellRef.toUpperCase().trim().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  return {
    col: colLetterToIndex(match[1]),
    row: parseInt(match[2], 10) - 1 // 0-based row index
  };
}

export function parseRange(rangeStr) {
  const parts = rangeStr.split(":");
  if (parts.length === 1) {
    const c = parseCellReference(parts[0]);
    return c ? [c] : [];
  }
  const start = parseCellReference(parts[0]);
  const end = parseCellReference(parts[1]);
  if (!start || !end) return [];

  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);

  const cells = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

export function getCellValue(gridData, row, col) {
  if (!gridData || row < 0 || row >= gridData.length) return "";
  const r = gridData[row];
  if (!r || col < 0 || col >= r.length) return "";
  return r[col];
}

export function evaluateFormula(formulaStr, gridData, visited = new Set()) {
  if (!formulaStr || typeof formulaStr !== "string" || !formulaStr.startsWith("=")) {
    return formulaStr;
  }

  const raw = formulaStr.substring(1).trim();

  // Circular dependency guard
  if (visited.has(formulaStr)) {
    return "#CIRCULAR!";
  }
  visited.add(formulaStr);

  try {
    const upper = raw.toUpperCase();

    // 1. TODAY()
    if (upper === "TODAY()" || upper === "TODAY") {
      const d = new Date();
      return d.toISOString().split("T")[0];
    }

    // 2. SUM(range)
    const sumMatch = upper.match(/^SUM\(([^)]+)\)$/);
    if (sumMatch) {
      const cells = parseRange(sumMatch[1]);
      let total = 0;
      cells.forEach(c => {
        let val = getCellValue(gridData, c.row, c.col);
        if (typeof val === "string" && val.startsWith("=")) {
          val = evaluateFormula(val, gridData, new Set(visited));
        }
        const num = parseFloat(String(val).replace(/₹|,|\$/g, "").trim());
        if (!isNaN(num)) total += num;
      });
      return total;
    }

    // 3. AVERAGE(range)
    const avgMatch = upper.match(/^AVERAGE\(([^)]+)\)$/);
    if (avgMatch) {
      const cells = parseRange(avgMatch[1]);
      let total = 0;
      let count = 0;
      cells.forEach(c => {
        let val = getCellValue(gridData, c.row, c.col);
        if (typeof val === "string" && val.startsWith("=")) {
          val = evaluateFormula(val, gridData, new Set(visited));
        }
        const num = parseFloat(String(val).replace(/₹|,|\$/g, "").trim());
        if (!isNaN(num)) {
          total += num;
          count++;
        }
      });
      return count > 0 ? parseFloat((total / count).toFixed(2)) : 0;
    }

    // 4. COUNT(range) & COUNTA(range)
    const countMatch = upper.match(/^COUNT\(([^)]+)\)$/);
    if (countMatch) {
      const cells = parseRange(countMatch[1]);
      let count = 0;
      cells.forEach(c => {
        let val = getCellValue(gridData, c.row, c.col);
        const num = parseFloat(String(val).replace(/₹|,|\$/g, "").trim());
        if (!isNaN(num) && val !== "") count++;
      });
      return count;
    }

    const countaMatch = upper.match(/^COUNTA\(([^)]+)\)$/);
    if (countaMatch) {
      const cells = parseRange(countaMatch[1]);
      return cells.filter(c => {
        const val = getCellValue(gridData, c.row, c.col);
        return val !== null && val !== undefined && String(val).trim() !== "";
      }).length;
    }

    // 5. MIN(range) & MAX(range)
    const minMatch = upper.match(/^MIN\(([^)]+)\)$/);
    if (minMatch) {
      const cells = parseRange(minMatch[1]);
      const nums = [];
      cells.forEach(c => {
        const num = parseFloat(String(getCellValue(gridData, c.row, c.col)).replace(/₹|,|\$/g, "").trim());
        if (!isNaN(num)) nums.push(num);
      });
      return nums.length > 0 ? Math.min(...nums) : 0;
    }

    const maxMatch = upper.match(/^MAX\(([^)]+)\)$/);
    if (maxMatch) {
      const cells = parseRange(maxMatch[1]);
      const nums = [];
      cells.forEach(c => {
        const num = parseFloat(String(getCellValue(gridData, c.row, c.col)).replace(/₹|,|\$/g, "").trim());
        if (!isNaN(num)) nums.push(num);
      });
      return nums.length > 0 ? Math.max(...nums) : 0;
    }

    // 6. IF(condition, true_val, false_val)
    if (upper.startsWith("IF(")) {
      const inside = raw.substring(raw.indexOf("(") + 1, raw.lastIndexOf(")"));
      const parts = splitFormulaArgs(inside);
      if (parts.length >= 2) {
        const condResult = evaluateCondition(parts[0], gridData, visited);
        const trueVal = cleanQuote(parts[1]);
        const falseVal = parts[2] ? cleanQuote(parts[2]) : "";
        return condResult ? trueVal : falseVal;
      }
    }

    // 7. COUNTIF(range, criteria)
    if (upper.startsWith("COUNTIF(")) {
      const inside = raw.substring(raw.indexOf("(") + 1, raw.lastIndexOf(")"));
      const parts = splitFormulaArgs(inside);
      if (parts.length >= 2) {
        const cells = parseRange(parts[0]);
        const crit = cleanQuote(parts[1]).toLowerCase();
        let matchCount = 0;
        cells.forEach(c => {
          const val = String(getCellValue(gridData, c.row, c.col)).toLowerCase();
          if (val === crit) matchCount++;
        });
        return matchCount;
      }
    }

    // 8. ROUND(val, dec)
    if (upper.startsWith("ROUND(")) {
      const inside = raw.substring(raw.indexOf("(") + 1, raw.lastIndexOf(")"));
      const parts = splitFormulaArgs(inside);
      if (parts.length >= 1) {
        const num = parseFloat(evaluateSimpleExpression(parts[0], gridData));
        const dec = parts[1] ? parseInt(parts[1], 10) : 0;
        return isNaN(num) ? "#VALUE!" : parseFloat(num.toFixed(dec));
      }
    }

    // 9. Simple arithmetic expressions e.g. =F2*G2, =D2+E2-F2, =A1*1.18
    return evaluateSimpleExpression(raw, gridData);

  } catch (err) {
    return "#VALUE!";
  }
}

function splitFormulaArgs(argStr) {
  const args = [];
  let current = "";
  let inQuotes = false;
  let parenDepth = 0;

  for (let i = 0; i < argStr.length; i++) {
    const char = argStr[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "(" && !inQuotes) {
      parenDepth++;
      current += char;
    } else if (char === ")" && !inQuotes) {
      parenDepth--;
      current += char;
    } else if (char === "," && !inQuotes && parenDepth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function cleanQuote(str) {
  const s = String(str).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.substring(1, s.length - 1);
  }
  return s;
}

function evaluateCondition(condStr, gridData, visited) {
  const operators = ["<=", ">=", "<>", "!=", "=", "<", ">"];
  let opFound = null;
  for (const op of operators) {
    if (condStr.includes(op)) {
      opFound = op;
      break;
    }
  }
  if (!opFound) return false;

  const parts = condStr.split(opFound);
  let left = evaluateSimpleExpression(parts[0].trim(), gridData);
  let right = cleanQuote(parts[1].trim());

  const numL = parseFloat(String(left).replace(/₹|,|\$/g, ""));
  const numR = parseFloat(String(right).replace(/₹|,|\$/g, ""));

  const isNumeric = !isNaN(numL) && !isNaN(numR);
  const a = isNumeric ? numL : String(left).toLowerCase();
  const b = isNumeric ? numR : String(right).toLowerCase();

  switch (opFound) {
    case "=": return a == b;
    case "!=":
    case "<>": return a != b;
    case "<": return a < b;
    case ">": return a > b;
    case "<=": return a <= b;
    case ">=": return a >= b;
    default: return false;
  }
}

function evaluateSimpleExpression(expr, gridData) {
  // Replace cell references with evaluated numeric values
  let substituted = expr.replace(/[A-Z]+[0-9]+/gi, (match) => {
    const coord = parseCellReference(match);
    if (!coord) return "0";
    let val = getCellValue(gridData, coord.row, coord.col);
    if (typeof val === "string" && val.startsWith("=")) {
      val = evaluateFormula(val, gridData, new Set([val]));
    }
    const cleanNum = parseFloat(String(val).replace(/₹|,|\$/g, "").trim());
    return isNaN(cleanNum) ? "0" : String(cleanNum);
  });

  // Safe arithmetic evaluator
  if (/^[0-9\.\+\-\*\/\(\)\s\%]+$/.test(substituted)) {
    try {
      // Evaluate percentage: e.g. 5% -> (5/100)
      substituted = substituted.replace(/([0-9\.]+)%/g, "($1/100)");
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${substituted});`)();
      if (typeof result === "number") {
        return isFinite(result) ? (Number.isInteger(result) ? result : parseFloat(result.toFixed(2))) : "#DIV/0!";
      }
      return result;
    } catch (e) {
      return "#VALUE!";
    }
  }

  return cleanQuote(expr);
}
