const listeners = {};
const read = (name) => JSON.parse(localStorage.getItem(`chunky_${name}`) || '[]');
const write = (name, rows) => { localStorage.setItem(`chunky_${name}`, JSON.stringify(rows)); (listeners[name] || []).forEach(cb => cb(read(name))); };
export const localListen = (name, callback, filter = () => true) => { const cb = rows => callback(rows.filter(filter).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))); listeners[name] = [...(listeners[name] || []), cb]; cb(read(name)); return () => { listeners[name] = (listeners[name] || []).filter(x => x !== cb); }; };
export const localAdd = async (name, data) => { const id = crypto.randomUUID(); const item = { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; write(name, [...read(name), item]); return { id }; };
export const localUpdate = async (name, id, data) => { write(name, read(name).map(x => x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)); };
