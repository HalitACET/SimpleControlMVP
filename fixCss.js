const fs = require('fs');
const empCss = fs.readFileSync('simple-control-web/src/components/employees/EmployeeDrawer.module.css', 'utf8');
const extraCss = `
.tableContainer {
  margin-top: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.tableHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background-color: var(--color-surface-sunken);
  border-bottom: 1px solid var(--color-border);
}

.tableHeaderTitle {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.applyAllContainer {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.applyAllBtn {
  height: 36px;
  padding: 0 var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s;
}

.applyAllBtn:hover {
  background: var(--color-surface-sunken);
  border-color: var(--color-border-hover);
}

.dayRow {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border-light);
}

.dayRow:last-child {
  border-bottom: none;
}

.dayName {
  width: 100px;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.daySelect {
  flex: 1;
  max-width: 200px;
}

.dayInfo {
  margin-left: var(--space-md);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.nightBadge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--space-xs);
  border-radius: var(--radius-full);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
  color: var(--color-info);
  background-color: var(--color-info-bg);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
`;

fs.writeFileSync('simple-control-web/src/components/work-groups/WorkGroupDrawer.module.css', empCss + '\n' + extraCss, 'utf8');
console.log('CSS encoding fixed');
