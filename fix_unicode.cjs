const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regexFixes = [
  { pattern: /Ã°Å¸â€œÂ /g, repl: '📍' },
  { pattern: /Ã°Å¸Â Â¢/g, repl: '🏢' },
  { pattern: /Ã°Å¸Â Â·Ã¯Â¸Â /g, repl: '🏗️' },
  { pattern: /Ã¢Â­Â /g, repl: '⭐' },
  { pattern: /Ã¢Å“â€¦/g, repl: '✅' },
  { pattern: /Ã°Å¸â€”â€œÃ¯Â¸Â /g, repl: '🗓️' },
  { pattern: /Ã°Å¸Â â€¦/g, repl: '🏅' },
  { pattern: /Ã¢â‚¬â€ /g, repl: '—' },
  // And just in case they have a space or invisible char at the end:
  { pattern: /Ã\w*â\w*â\w*Ã\w*â\w*\—/g, repl: '—' },
  // Let's also do a fallback for unparsed ones.
  { pattern: /Ã°Å¸â€œÂ§/g, repl: '📧' },
  { pattern: /Ã°Å¸â€œÂ±/g, repl: '📱' },
  { pattern: /Ã°Å¸â€œÂ/g, repl: '📍' },
  { pattern: /Ã°Å¸Â Â¢/g, repl: '🏢' },
  { pattern: /Ã°Å¸â€™Â¼/g, repl: '💼' },
  { pattern: /Ã¢Â­Â/g, repl: '⭐' },
  { pattern: /Ã°Å¸Å½Â¯/g, repl: '🎯' },
  { pattern: /Ã°Å¸â€œÅ¡/g, repl: '📚' },
  { pattern: /Ã¢Å“â€¦/g, repl: '✅' },
  { pattern: /Ã°Å¸Å½â€œ/g, repl: '🎓' },
];

for (const fix of regexFixes) {
  file = file.replace(fix.pattern, fix.repl);
}

// Additional brute force cleanup for anything starting with Ã that isn't supposed to be there.
// If it's a label we just manually rebuild the array mapping.
file = file.replace(/\{ label: '.*Email',/g, "{ label: '📧 Email',");
file = file.replace(/\{ label: '.*Phone',/g, "{ label: '📱 Phone',");
file = file.replace(/\{ label: '.*Location',/g, "{ label: '📍 Location',");
file = file.replace(/\{ label: '.*Department',/g, "{ label: '🏢 Department',");
file = file.replace(/\{ label: '.*Years in IT',/g, "{ label: '💼 Years in IT',");
file = file.replace(/\{ label: '.*Years@Zensar',/g, "{ label: '🏗️ Years@Zensar',");
file = file.replace(/\{ label: '.*Primary Skill',/g, "{ label: '⭐ Primary Skill',");
file = file.replace(/\{ label: '.*Domain',/g, "{ label: '🎯 Domain',");
file = file.replace(/\{ label: '.*Education',/g, "{ label: '📚 Education',");
file = file.replace(/\{ label: '.*Validated',/g, "{ label: '✅ Validated',");
file = file.replace(/\{ label: '.*Joined',/g, "{ label: '🗓️ Joined',");
file = file.replace(/div>.* एजुकेशन/g, "div>🎓 Education"); // Just in case
file = file.replace(/div>.* Education/g, "div>🎓 Education");
file = file.replace(/div>.* Certifications/g, "div>🏅 Certifications");
file = file.replace(/\|\| 'Ã¢â‚¬â€ '/g, "|| '—'");
file = file.replace(/\|\| '.*'/g, (m) => m.includes('—') ? "|| '—'" : m);

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log('Fixed using robust regex.');
