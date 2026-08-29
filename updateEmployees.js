const fs = require('fs');
let code = fs.readFileSync('simple-control-web/src/pages/Employees.tsx', 'utf8');

// Interface
code = code.replace(
  "cardNo: string;",
  "cardNo: string;\n  workGroupId?: number;\n  workGroupName?: string;"
);

// Table Header
code = code.replace(
  "<th className={styles.th}>Kart No</th>",
  "<th className={styles.th}>Kart No</th>\n              <th className={styles.th}>Çalışma Grubu</th>"
);

// Table skeleton
code = code.replace(
  "<td className={styles.td}><div className={styles.skeleton} style={{ width: '80px' }}></div></td>\n                  <td className={styles.td}></td>",
  "<td className={styles.td}><div className={styles.skeleton} style={{ width: '80px' }}></div></td>\n                  <td className={styles.td}><div className={styles.skeleton} style={{ width: '120px' }}></div></td>\n                  <td className={styles.td}></td>"
);

// Table empty state colspan
code = code.replace(
  "colSpan={4}",
  "colSpan={5}"
);

// Table Data
code = code.replace(
  "<td className={styles.tdMono}>\n                      {employee.cardNo}\n                    </td>\n                    <td className={styles.td} style={{ textAlign: 'right' }}>",
  `<td className={styles.tdMono}>
                      {employee.cardNo}
                    </td>
                    <td className={styles.td} style={{ color: employee.workGroupName ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', opacity: employee.workGroupName ? 1 : 0.6 }}>
                      {employee.workGroupName || '—'}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>`
);

fs.writeFileSync('simple-control-web/src/pages/Employees.tsx', code);
console.log('Employees updated');
