/**
 * APERTURE Markdown-to-HTML renderer
 * Converts AI-generated markdown reports into styled HTML
 */
function markdownToHtml(md) {
  if (!md) return '';

  // Normalize line endings
  var lines = md.replace(/\r\n/g, '\n').split('\n');
  var html = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    // Blank lines
    if (line.trim() === '') { i++; continue; }

    // Tables: collect all consecutive | lines
    if (/^\|.+\|/.test(line.trim())) {
      var tableLines = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    // Blockquotes: collect consecutive > lines
    if (/^>\s?/.test(line)) {
      var bqLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      html.push('<blockquote>' + inlineFormat(bqLines.join('<br/>')) + '</blockquote>');
      continue;
    }

    // Headings
    var headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      var text = inlineFormat(headingMatch[2]);
      html.push('<h' + level + '>' + text + '</h' + level + '>');
      i++;
      continue;
    }

    // Horizontal rules
    if (/^[\-\*\_]{3,}\s*$/.test(line.trim())) {
      html.push('<hr/>');
      i++;
      continue;
    }

    // Unordered list: collect consecutive - or * items
    if (/^[\-\*]\s+/.test(line)) {
      var listItems = [];
      while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\-\*]\s+/, ''));
        i++;
      }
      html.push('<ul>' + listItems.map(function(li) { return '<li>' + inlineFormat(li) + '</li>'; }).join('') + '</ul>');
      continue;
    }

    // Ordered list: collect consecutive numbered items
    if (/^\d+[\.\)]\s+/.test(line)) {
      var olItems = [];
      while (i < lines.length && /^\d+[\.\)]\s+/.test(lines[i])) {
        olItems.push(lines[i].replace(/^\d+[\.\)]\s+/, ''));
        i++;
      }
      html.push('<ol>' + olItems.map(function(li) { return '<li>' + inlineFormat(li) + '</li>'; }).join('') + '</ol>');
      continue;
    }

    // Regular paragraph
    html.push('<p>' + inlineFormat(line) + '</p>');
    i++;
  }

  return html.join('\n');
}

function renderTable(tableLines) {
  if (tableLines.length < 2) return '<p>' + inlineFormat(tableLines[0] || '') + '</p>';

  // Parse rows
  var rows = [];
  var sepIndex = -1;
  for (var r = 0; r < tableLines.length; r++) {
    var raw = tableLines[r].replace(/^\|/, '').replace(/\|$/, '');
    var cells = raw.split('|').map(function(c) { return c.trim(); });
    // Check if this is the separator row (---|---|---)
    if (cells.every(function(c) { return /^[\-:]+$/.test(c); })) {
      sepIndex = r;
    } else {
      rows.push({ cells: cells, isHeader: sepIndex === -1 && r === 0 && tableLines.length > 1 });
    }
  }

  if (rows.length === 0) return '';

  var out = '<div class="table-wrap"><table>';

  // First row is always header if we found a separator
  if (sepIndex >= 0 || rows.length > 1) {
    var headerRow = rows[0];
    out += '<thead><tr>' + headerRow.cells.map(function(c) { return '<th>' + inlineFormat(c) + '</th>'; }).join('') + '</tr></thead>';
    out += '<tbody>';
    for (var b = 1; b < rows.length; b++) {
      out += '<tr>' + rows[b].cells.map(function(c) { return '<td>' + inlineFormat(c) + '</td>'; }).join('') + '</tr>';
    }
    out += '</tbody>';
  } else {
    out += '<tbody>';
    for (var s = 0; s < rows.length; s++) {
      out += '<tr>' + rows[s].cells.map(function(c) { return '<td>' + inlineFormat(c) + '</td>'; }).join('') + '</tr>';
    }
    out += '</tbody>';
  }

  out += '</table></div>';
  return out;
}

function inlineFormat(text) {
  return text
    // Escape raw HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Inline code / backtick tags (before bold/italic to avoid conflicts)
    .replace(/`([^`]+)`/g, function(m, code) {
      var upper = code.toUpperCase();
      // Style known tags as badges
      if (upper === 'MACRO') return '<span class="tag tag-macro">MACRO</span>';
      if (upper === 'MICRO') return '<span class="tag tag-micro">MICRO</span>';
      if (upper === 'HIGH' || upper === 'HIGH RISK') return '<span class="tag tag-high">HIGH</span>';
      if (upper === 'MEDIUM' || upper === 'MEDIUM RISK') return '<span class="tag tag-med">MEDIUM</span>';
      if (upper === 'LOW' || upper === 'LOW RISK') return '<span class="tag tag-low">LOW</span>';
      return '<code>' + code + '</code>';
    })
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
}
