/* =========================================================
   SafariNomad: admin team accounts, sign-in and activity log
   ---------------------------------------------------------
   server/data/users.json     team members (passwords stored
                              only as salted scrypt hashes)
   server/data/sessions.json  signed-in devices (token hashes,
                              so a stolen file can't sign in)
   server/data/activity.json  who did what, newest last

   Roles
     owner    everything, including adding and removing people
     manager  everything except managing the team
     agent    bookings, enquiries, follow-ups and chat questions
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROLES = {
  owner:   { label: 'Owner',       can: ['work', 'website', 'demo', 'team'] },
  manager: { label: 'Manager',     can: ['work', 'website', 'demo'] },
  agent:   { label: 'Sales agent', can: ['work'] }
};
const SESSION_MS = 12 * 3600_000;          // signed out after 12 hours
const MAX_ACTIVITY = 20_000;

export class TeamError extends Error { constructor(msg, status = 400){ super(msg); this.status = status; } }

export function createTeam({ dir, firstOwner }){
  const file = n => path.join(dir, n + '.json');
  const read = (n, fallback) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch { return fallback; } };
  const timers = {};
  function write(n, value){
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file(n) + '.tmp', JSON.stringify(value, null, 1));
      fs.renameSync(file(n) + '.tmp', file(n));
    } catch(err){ console.error(`[team] could not write ${n}.json:`, err.message); }
  }
  const writeSoon = (n, get, ms = 3000) => { if(!timers[n]) timers[n] = setTimeout(() => { timers[n] = 0; write(n, get()); }, ms); };
  const flush = () => Object.keys(timers).forEach(n => { if(timers[n]){ clearTimeout(timers[n]); timers[n] = 0; write(n, { users, sessions, activity }[n]); } });

  let users = read('users', []);
  let sessions = read('sessions', {});      // sha256(token) → { uid, exp }
  let activity = read('activity', []);
  const saveUsers = () => write('users', users);
  const saveSessions = () => writeSoon('sessions', () => sessions, 1000);
  const saveActivity = () => writeSoon('activity', () => activity);

  const hashOf = (pw, salt) => crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString('base64');
  const tokenHash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
  const now = () => new Date().toISOString();
  const newId = () => crypto.randomBytes(6).toString('hex');
  const clean = (v, max) => String(v ?? '').trim().slice(0, max).replace(/[<>"`]/g, '');
  const cleanUsername = v => String(v || '').trim().toLowerCase();
  const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;
  const DUMMY = hashOf('x', 'timing-equaliser');

  function setPassword(u, pw){
    if(String(pw).length < 8) throw new TeamError('Passwords need at least 8 characters.');
    if(String(pw).length > 200) throw new TeamError('That password is too long.');
    u.salt = crypto.randomBytes(16).toString('base64');
    u.hash = hashOf(pw, u.salt);
    u.passwordChanged = now();
  }
  const publicUser = u => u && ({ id: u.id, username: u.username, name: u.name, role: u.role, roleLabel: ROLES[u.role].label,
    disabled: !!u.disabled, demo: !!u.demo, created: u.created, createdBy: u.createdBy || '', lastLogin: u.lastLogin || '',
    lastSeen: u.lastSeen || '', logins: u.logins || 0, mustChange: !!u.mustChange });
  const can = (u, what) => !!(u && ROLES[u.role] && ROLES[u.role].can.includes(what));
  const owners = () => users.filter(u => u.role === 'owner' && !u.disabled && !u.demo);
  const find = id => users.find(u => u.id === id && !u.demo);
  const dropSessions = uid => { Object.keys(sessions).forEach(k => { if(sessions[k].uid === uid) delete sessions[k]; }); saveSessions(); };

  // First run: one owner account, from ADMIN_USERNAME / ADMIN_PASSWORD (or the old password file)
  let created = null;
  if(!users.some(u => !u.demo)){
    const { username, name, password } = firstOwner();
    const u = { id: newId(), username: cleanUsername(username), name: clean(name, 60), role: 'owner', created: now(), createdBy: 'setup', logins: 0 };
    u.salt = crypto.randomBytes(16).toString('base64'); u.hash = hashOf(password, u.salt);   // may be short; flagged below
    users.push(u); saveUsers();
    created = { username: u.username, password };
  }

  function log(user, action, detail = '', extra = {}){
    activity.push({ id: newId(), at: now(), uid: user ? user.id : '', name: user ? user.name : (extra.name || 'Unknown'), action, detail: String(detail).slice(0, 300), ...extra.fields });
    if(activity.length > MAX_ACTIVITY) activity.splice(0, activity.length - MAX_ACTIVITY);
    saveActivity();
  }

  function login(username, password, meta = {}){
    const u = users.find(x => x.username === cleanUsername(username) && !x.demo);
    // Always run the hash, so a wrong username takes as long as a wrong password
    const ok = u && u.hash ? crypto.timingSafeEqual(Buffer.from(hashOf(password, u.salt)), Buffer.from(u.hash)) : (hashOf(password, 'timing-equaliser') === DUMMY && false);
    if(!ok){ log(null, 'Failed sign-in', `Username "${clean(username, 40)}"${meta.ip ? ' from ' + meta.ip : ''}`, { name: 'Security' }); return null; }
    if(u.disabled){ log(u, 'Blocked sign-in', 'Account is switched off'); throw new TeamError('This account is switched off. Ask the owner to switch it back on.', 403); }
    const token = crypto.randomBytes(32).toString('hex');
    sessions[tokenHash(token)] = { uid: u.id, exp: Date.now() + SESSION_MS, ip: meta.ip || '', agent: clean(meta.agent, 120) };
    u.lastLogin = now(); u.lastSeen = u.lastLogin; u.logins = (u.logins || 0) + 1; saveUsers();
    saveSessions();
    log(u, 'Signed in', meta.ip ? `from ${meta.ip}` : '');
    return { token, user: publicUser(u), weak: String(password).length < 8 };
  }
  function userOf(token){
    if(!token) return null;
    const k = tokenHash(token), s = sessions[k];
    if(!s || s.exp < Date.now()){ if(s){ delete sessions[k]; saveSessions(); } return null; }
    const u = find(s.uid);
    if(!u || u.disabled){ delete sessions[k]; saveSessions(); return null; }
    // "Last active", saved at most every 5 minutes
    if(!u.lastSeen || Date.now() - Date.parse(u.lastSeen) > 300_000){ u.lastSeen = now(); writeSoon('users', () => users, 5000); }
    return u;
  }
  function logout(token){ const k = tokenHash(token), s = sessions[k]; if(s){ const u = find(s.uid); delete sessions[k]; saveSessions(); if(u) log(u, 'Signed out'); } }

  function addUser(b, by){
    const username = cleanUsername(b.username), name = clean(b.name, 60), role = b.role;
    if(!name) throw new TeamError('Please enter their name.');
    if(!USERNAME.test(username)) throw new TeamError('Usernames are 3 to 30 characters: letters, numbers, dots, dashes or underscores.');
    if(users.some(u => u.username === username && !u.demo)) throw new TeamError('That username is taken.');
    if(!ROLES[role]) throw new TeamError('Please choose a role.');
    const u = { id: newId(), username, name, role, created: now(), createdBy: by.name, logins: 0 };
    setPassword(u, b.password);
    u.mustChange = !!b.mustChange;                          // optional: they pick their own at first sign-in
    users.push(u); saveUsers();
    log(by, 'Added team member', `${name} (${username}) as ${ROLES[role].label}`);
    return publicUser(u);
  }
  function updateUser(id, b, by){
    const u = find(id);
    if(!u) throw new TeamError('Team member not found.', 404);
    const changes = [];
    if(b.name !== undefined && clean(b.name, 60) && clean(b.name, 60) !== u.name){ changes.push(`name → ${clean(b.name, 60)}`); u.name = clean(b.name, 60); }
    if(b.username !== undefined && cleanUsername(b.username) !== u.username){
      const un = cleanUsername(b.username);
      if(!USERNAME.test(un)) throw new TeamError('Usernames are 3 to 30 characters: letters, numbers, dots, dashes or underscores.');
      if(users.some(x => x.username === un && x !== u && !x.demo)) throw new TeamError('That username is taken.');
      changes.push(`username → ${un}`); u.username = un;
    }
    if(b.role !== undefined && b.role !== u.role){
      if(!ROLES[b.role]) throw new TeamError('Unknown role.');
      if(u.role === 'owner' && owners().length <= 1) throw new TeamError('There must always be at least one owner.');
      changes.push(`role → ${ROLES[b.role].label}`); u.role = b.role;
    }
    if(b.disabled !== undefined && !!b.disabled !== !!u.disabled){
      if(b.disabled && u.id === by.id) throw new TeamError('You can\'t switch off your own account.');
      if(b.disabled && u.role === 'owner' && owners().length <= 1) throw new TeamError('There must always be at least one owner.');
      u.disabled = !!b.disabled; changes.push(u.disabled ? 'switched off' : 'switched on');
      if(u.disabled) dropSessions(u.id);
    }
    if(b.password){ setPassword(u, b.password); u.mustChange = !!b.mustChange; if(u.id !== by.id) dropSessions(u.id); changes.push('password changed'); }
    if(!changes.length) return publicUser(u);
    saveUsers();
    log(by, 'Changed team member', `${u.name}: ${changes.join(', ')}`);
    return publicUser(u);
  }
  function removeUser(id, by){
    const u = find(id);
    if(!u) throw new TeamError('Team member not found.', 404);
    if(u.id === by.id) throw new TeamError('You can\'t remove yourself.');
    if(u.role === 'owner' && owners().length <= 1) throw new TeamError('There must always be at least one owner.');
    users = users.filter(x => x !== u); saveUsers(); dropSessions(u.id);
    log(by, 'Removed team member', `${u.name} (${u.username})`);
  }
  function changePassword(u, current, next){
    if(!crypto.timingSafeEqual(Buffer.from(hashOf(current, u.salt)), Buffer.from(u.hash))) throw new TeamError('Your current password is not right.');
    if(String(next) === String(current)) throw new TeamError('Please choose a new password, different from the current one.');
    setPassword(u, next); u.mustChange = false; saveUsers();
    log(u, 'Changed own password');
  }
  // Recovery from the command line (npm run reset-password)
  function resetFromCli(username, pw){
    const u = users.find(x => x.username === cleanUsername(username) && !x.demo);
    if(!u) throw new TeamError(`No team member called "${username}".`);
    setPassword(u, pw); u.disabled = false; u.mustChange = false; saveUsers(); dropSessions(u.id);
    log(null, 'Password reset from server', u.name, { name: 'Server' });
    return u;
  }

  // Demo team members (Load demo data): they can't sign in (no password) and are removed by Clear
  function setDemo(list, acts){
    users = users.filter(u => !u.demo).concat(list.map(u => ({ ...u, demo: true, hash: null, salt: null })));
    activity = activity.filter(a => !a.demo).concat(acts.map(a => ({ ...a, demo: true }))).sort((a, b) => a.at.localeCompare(b.at));
    saveUsers(); write('activity', activity);
  }

  // Names only, for "assigned to" lists and the activity feed (every role)
  const directory = () => users.map(u => ({ id: u.id, name: u.name, role: u.role, demo: !!u.demo }));

  return { ROLES, created, can, log, login, userOf, logout, addUser, updateUser, removeUser, changePassword, resetFromCli, setDemo, flush,
    publicUser, directory, users: () => users.map(publicUser), activity: (n = 3000) => activity.slice(-n), byId: id => users.find(u => u.id === id) };
}
