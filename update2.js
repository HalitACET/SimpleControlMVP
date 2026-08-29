const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('simple-control-web/src/App.tsx', 'utf8');
app = app.replace(
  "import Shifts from './pages/Shifts';",
  "import Shifts from './pages/Shifts';\nimport WorkGroups from './pages/WorkGroups';"
);
app = app.replace(
  '<Route path="/shifts" element={<Shifts />} />',
  '<Route path="/shifts" element={<Shifts />} />\n            <Route path="/work-groups" element={<WorkGroups />} />'
);
fs.writeFileSync('simple-control-web/src/App.tsx', app);

// 2. Topbar.tsx
let topbar = fs.readFileSync('simple-control-web/src/components/layout/Topbar.tsx', 'utf8');
topbar = topbar.replace(
  "'/shifts': { group: 'Tanımlar', title: 'Vardiyalar' },",
  "'/shifts': { group: 'Tanımlar', title: 'Vardiyalar' },\n  '/work-groups': { group: 'Tanımlar', title: 'Çalışma Grupları' },"
);
fs.writeFileSync('simple-control-web/src/components/layout/Topbar.tsx', topbar);

// 3. Sidebar.tsx
let sidebar = fs.readFileSync('simple-control-web/src/components/layout/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "{ label: 'Vardiyalar', path: '/shifts', icon: <CalendarDays size={18} /> },",
  "{ label: 'Vardiyalar', path: '/shifts', icon: <CalendarDays size={18} /> },\n        { label: 'Çalışma Grupları', path: '/work-groups', icon: <Users size={18} /> },"
);
fs.writeFileSync('simple-control-web/src/components/layout/Sidebar.tsx', sidebar);

console.log('Routes added.');
