const fs = require('fs');
let code = fs.readFileSync('simple-control-web/src/components/employees/EmployeeDrawer.tsx', 'utf8');

// Imports
code = code.replace(
  "import FormInput from '../ui/form/FormInput';",
  "import FormInput from '../ui/form/FormInput';\nimport FormSelect from '../ui/form/FormSelect';\nimport { type WorkGroupListResponse } from '../../pages/WorkGroups';"
);

// State
code = code.replace(
  "const [cardNo, setCardNo] = useState('');",
  "const [cardNo, setCardNo] = useState('');\n  const [workGroupId, setWorkGroupId] = useState('');\n  const [workGroups, setWorkGroups] = useState<WorkGroupListResponse[]>([]);"
);

// Effect to load work groups
code = code.replace(
  "setIsSubmitting(false);",
  "setIsSubmitting(false);\n\n      api.get('/admin/work-groups').then(res => setWorkGroups(res.data)).catch(err => setGlobalError(handleApiError(err)));"
);

// Load existing employee data
code = code.replace(
  "setCardNo(employeeToEdit.cardNo);",
  "setCardNo(employeeToEdit.cardNo);\n        setWorkGroupId(employeeToEdit.workGroupId ? String(employeeToEdit.workGroupId) : '');"
);

// Reset form
code = code.replace(
  "setCardNo('');",
  "setCardNo('');\n        setWorkGroupId('');"
);

// Payload
code = code.replace(
  "const payload = { firstName, lastName, cardNo };",
  "const payload = { firstName, lastName, cardNo, workGroupId: workGroupId ? parseInt(workGroupId) : null };"
);

// FormSelect UI
code = code.replace(
  "</form>",
  `  <FormSelect
              label="Çalışma Grubu"
              value={workGroupId}
              onChange={(e) => {
                setWorkGroupId(e.target.value);
                if (!isDirty) setIsDirty(true);
              }}
              options={[{ value: '', label: 'Atanmamış' }, ...workGroups.map(wg => ({ value: String(wg.id), label: wg.name }))]}
            />
          </form>`
);

fs.writeFileSync('simple-control-web/src/components/employees/EmployeeDrawer.tsx', code);
console.log('EmployeeDrawer updated');
