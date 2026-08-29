const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('simple-control-web/src/App.tsx', 'utf8');
app = app.replace(
  "import WorkGroups from './pages/WorkGroups';",
  "import WorkGroups from './pages/WorkGroups';\nimport Holidays from './pages/Holidays';"
);
app = app.replace(
  '<Route path="/work-groups" element={<WorkGroups />} />',
  '<Route path="/work-groups" element={<WorkGroups />} />\n            <Route path="/holidays" element={<Holidays />} />'
);
fs.writeFileSync('simple-control-web/src/App.tsx', app);

// 2. Topbar.tsx
let topbar = fs.readFileSync('simple-control-web/src/components/layout/Topbar.tsx', 'utf8');
topbar = topbar.replace(
  "'/work-groups': { group: 'Tanımlar', title: 'Çalışma Grupları' },",
  "'/work-groups': { group: 'Tanımlar', title: 'Çalışma Grupları' },\n  '/holidays': { group: 'Tanımlar', title: 'Tatiller' },"
);
fs.writeFileSync('simple-control-web/src/components/layout/Topbar.tsx', topbar);

// 3. Sidebar.tsx
let sidebar = fs.readFileSync('simple-control-web/src/components/layout/Sidebar.tsx', 'utf8');
if (sidebar.includes('import { Users, Cpu, MapPin, Clock, CalendarDays, FileText, Palette, ChevronsLeft, ChevronsRight, Layers } from \'lucide-react\';')) {
  sidebar = sidebar.replace(
    "import { Users, Cpu, MapPin, Clock, CalendarDays, FileText, Palette, ChevronsLeft, ChevronsRight, Layers } from 'lucide-react';",
    "import { Users, Cpu, MapPin, Clock, CalendarDays, FileText, Palette, ChevronsLeft, ChevronsRight, Layers, Sun } from 'lucide-react';"
  );
} else {
    // just append it somewhere if needed, but the first replace should work based on my previous edit
}

sidebar = sidebar.replace(
  "{ label: 'Çalışma Grupları', path: '/work-groups', icon: <Layers size={18} /> },",
  "{ label: 'Çalışma Grupları', path: '/work-groups', icon: <Layers size={18} /> },\n        { label: 'Tatiller', path: '/holidays', icon: <Sun size={18} /> },"
);
fs.writeFileSync('simple-control-web/src/components/layout/Sidebar.tsx', sidebar);

console.log('Routes added.');
