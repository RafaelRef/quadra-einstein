// Utilitários gerais do Quadra Einstein

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  // formato esperado por <input type="datetime-local">
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function pct(made, att) {
  if (!att || att === 0) return '0%';
  return Math.round(made / att * 100) + '%';
}

export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export function showToast(message, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Converte linhas (array de arrays) num CSV compatível com Excel/Sheets em pt-BR.
function csvCell(value) {
  const s = String(value ?? '');
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(rows) {
  return rows.map(row => row.map(csvCell).join(';')).join('\r\n');
}

export function downloadCSV(filename, rows) {
  const csv = '﻿' + toCSV(rows); // BOM para o Excel reconhecer acentos
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Aguarde...';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
}
