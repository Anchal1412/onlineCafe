const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'payments.json');

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeAll(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function create(payment) {
  const all = readAll();
  all.push(payment);
  writeAll(all);
  return payment;
}

async function get(id) {
  const all = readAll();
  return all.find(p => p.id === id || p.id === id) || null;
}

async function update(id, updates) {
  const all = readAll();
  const idx = all.findIndex(p => p.id === id || p.id === id);
  if (idx === -1) return null;
  all[idx] = Object.assign({}, all[idx], updates);
  writeAll(all);
  return all[idx];
}

module.exports = { create, get, update };
