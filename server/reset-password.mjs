/* =========================================================
   Reset a team member's admin password from the server.
   Use it when someone (even the owner) is locked out:

     npm run reset-password -- <username> <new password>

   The account is switched back on, signed out everywhere,
   and asked to choose a new password at the next sign-in.
   Stop the server first, or restart it afterwards.
   ========================================================= */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTeam } from './team.mjs';

const [username, password] = process.argv.slice(2);
if(!username || !password){
  console.log('Usage: npm run reset-password -- <username> <new password>');
  process.exit(1);
}
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const team = createTeam({ dir, firstOwner: () => ({ username, name: username, password }) });
try {
  if(team.created) console.log(`No team existed yet, so "${username}" was created as the owner.`);
  else { const u = team.resetFromCli(username, password); console.log(`Password reset for ${u.name} (${u.username}).`); }
  team.flush();
} catch(err){
  console.error(err.message);
  process.exit(1);
}
