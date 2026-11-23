// Vyapar Verse — Markdown to HTML Converter
// Converts AI markdown (headers, bold, italics, bullet lists, code blocks, tables)
// into clean, beautiful, high-contrast HTML elements without leaking raw markdown symbols.

export function formatMarkdown(md) {
  if (!md || typeof md !== "string") return "";

  // Normalize line endings
  let text = md.replace(/\r\n/g, "\n");

  // 1. Code blocks ```language ... ```
  text = text.replace(/```(?:[a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g, (match, code) => {
    return `<pre style="background: #070B14; border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 8px; padding: 12px 14px; margin: 10px 0; overflow-x: auto; color: #38BDF8; font-family: monospace; font-size: 12px; line-height: 1.5;"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // 2. Inline code `code`
  text = text.replace(/`([^`\n]+)`/g, (match, inline) => {
    return `<code style="background: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 4px; color: #FCD34D; font-family: monospace; font-size: 12px;">${escapeHtml(inline)}</code>`;
  });

  // 3. Headers: ###, ##, #
  text = text.replace(/^###[ \t]+(.*)$/gm, '<h4 style="font-size: 15px; font-weight: 800; color: #FFFFFF; margin: 14px 0 6px; border-bottom: 1px solid rgba(59, 130, 246, 0.25); padding-bottom: 4px; letter-spacing: -0.2px;">$1</h4>');
  text = text.replace(/^##[ \t]+(.*)$/gm, '<h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 16px 0 8px; border-bottom: 1px solid rgba(59, 130, 246, 0.35); padding-bottom: 6px;">$1</h3>');
  text = text.replace(/^#[ \t]+(.*)$/gm, '<h2 style="font-size: 18px; font-weight: 900; color: #FFFFFF; margin: 18px 0 10px;">$1</h2>');

  // 4. Bold: **text** or __text__
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFFFFF; font-weight: 700;">$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong style="color: #FFFFFF; font-weight: 700;">$1</strong>');

  // 5. Italic: *text* (not inside variable names with underscores like store_id)
  text = text.replace(/(^|[^\w*])\*([^*\n]+)\*([^\w*]|$)/g, '$1<em style="color: #CBD5E1;">$2</em>$3');

  // 6. Bullet lists: lines starting with "- " or "* "
  const lines = text.split("\n");
  let inList = false;
  let newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (!inList) {
        inList = true;
        newLines.push('<ul style="margin: 8px 0 12px 18px; padding-left: 4px; list-style-type: disc;">');
      }
      newLines.push(`<li style="margin-bottom: 6px; color: #E2E8F0; line-height: 1.5;">${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        inList = false;
        newLines.push('</ul>');
      }
      newLines.push(line);
    }
  }
  if (inList) newLines.push('</ul>');
  text = newLines.join("\n");

  // 7. Paragraphs: split by double newlines
  const blocks = text.split(/\n\s*\n/);
  text = blocks.map(block => {
    block = block.trim();
    if (!block) return "";
    if (/^<(h\d|ul|ol|pre|table|div)/i.test(block)) {
      return block;
    }
    return `<p style="margin: 8px 0; line-height: 1.6; color: #E2E8F0;">${block.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean).join("\n");

  // 8. Safety clean-up: remove any orphaned markdown tokens
  text = text.replace(/#{2,}\s*/g, '');
  text = text.replace(/\*{2,}/g, '');

  return text;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if (typeof window !== "undefined") {
  window.formatMarkdown = formatMarkdown;
}
