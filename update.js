const fs = require('fs');
let file = fs.readFileSync('simple-control-web/src/components/layout/Sidebar.tsx', 'utf8');

const newGroups = `  const groups = [
    {
      label: 'Tanımlar',
      items: [
        { label: 'Personel', path: '/employees', icon: <Users size={18} /> },
        { label: 'Cihazlar', path: '#cihazlar', icon: <Cpu size={18} /> },
        { label: 'Lokasyonlar', path: '#lokasyonlar', icon: <MapPin size={18} /> },
        { label: 'Vardiyalar', path: '/shifts', icon: <CalendarDays size={18} /> },
      ],
    },
    {
      label: 'İşlemler',
      items: [
        { label: 'Puantaj', path: '#puantaj', icon: <Clock size={18} /> },
      ],
    },
    {
      label: 'Raporlar',
      items: [
        { label: 'Günlük Rapor', path: '#rapor', icon: <FileText size={18} /> },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { label: 'Tasarım Sistemi', path: '/styleguide', icon: <Palette size={18} /> },
      ],
    },
  ];`;

file = file.replace(/const groups = \[[\s\S]*?  \];/, newGroups);
fs.writeFileSync('simple-control-web/src/components/layout/Sidebar.tsx', file);
console.log('Sidebar groups updated successfully');
