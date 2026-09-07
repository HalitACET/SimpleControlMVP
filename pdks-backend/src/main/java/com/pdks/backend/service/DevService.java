package com.pdks.backend.service;

import com.pdks.backend.entity.*;
import com.pdks.backend.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevService {

    private final EntityManager em;
    private final ShiftRepository shiftRepository;
    private final DepartmentRepository departmentRepository;
    private final WorkGroupRepository workGroupRepository;
    private final HolidayRepository holidayRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SimulatorService simulatorService;

    @Transactional
    public Map<String, Object> seedDemo(String firmId) {
        Map<String, Object> stats = new LinkedHashMap<>();

        // 1. Delete existing demo data

        stats.put("deletedDevices", em.createQuery("DELETE FROM Device d WHERE d.user.firmId = :firmId AND d.user.employee IS NOT NULL").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedRawScans", em.createQuery("DELETE FROM RawScan r WHERE r.employee.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedUsers", em.createQuery("DELETE FROM User u WHERE u.firmId = :firmId AND u.employee IS NOT NULL").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedEmployees", em.createQuery("DELETE FROM Employee e WHERE e.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedWorkGroupDays", em.createQuery("DELETE FROM WorkGroupDay wgd WHERE wgd.workGroup.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedWorkGroups", em.createQuery("DELETE FROM WorkGroup wg WHERE wg.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedDepartments", em.createQuery("DELETE FROM Department d WHERE d.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());

        stats.put("deletedShifts", em.createQuery("DELETE FROM Shift s WHERE s.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());
        stats.put("deletedHolidays", em.createQuery("DELETE FROM Holiday h WHERE h.firmId = :firmId").setParameter("firmId", firmId).executeUpdate());
        
        // 2. Create Shifts
        Shift gunduz = createShift(firmId, "Gündüz", "08:00", "17:00", "12:30", "13:30", 10, 10);
        Shift gece = createShift(firmId, "Gece", "22:00", "06:00", "02:00", "02:30", 10, 10);
        Shift yarim = createShift(firmId, "Yarım Gün", "08:00", "13:00", null, null, 10, 10);

        // 3. Create Departments
        Department uretim = createDept(firmId, "Üretim", "Üretim hattı personeli");
        Department idari = createDept(firmId, "İdari İşler", "Ofis ve yönetim personeli");
        Department lojistik = createDept(firmId, "Lojistik", "Sevkiyat ve depo");

        // 4. Create WorkGroups
        WorkGroup wgGunduz = createWgGunduz(firmId, gunduz);
        WorkGroup wgGece = createWgGece(firmId, gece);
        WorkGroup wgVardiyali = createWgVardiyali(firmId, gunduz, gece, yarim);

        // 5. Create Holidays (for year 2026)
        createHolidays(firmId, 2026);

        // 6. Create Employees
        List<Employee> emps = new ArrayList<>();
        emps.add(createEmp(firmId, "Ahmet", "Yılmaz", "1001", uretim, wgGunduz));
        emps.add(createEmp(firmId, "Mehmet", "Demir", "1002", uretim, wgGunduz));
        emps.add(createEmp(firmId, "Ayşe", "Kaya", "1003", uretim, wgGunduz));
        emps.add(createEmp(firmId, "Fatma", "Çelik", "1004", uretim, wgGece));
        emps.add(createEmp(firmId, "Ali", "Şahin", "1005", uretim, wgGece));
        emps.add(createEmp(firmId, "Mustafa", "Öztürk", "1006", idari, wgGunduz));
        emps.add(createEmp(firmId, "Zeynep", "Arslan", "1007", idari, wgGunduz));
        emps.add(createEmp(firmId, "Hasan", "Doğan", "1008", lojistik, wgVardiyali));

        // Create Users for first 5
        for (int i = 0; i < 5; i++) {
            Employee e = emps.get(i);
            User u = new User();
            u.setFirmId(firmId);
            u.setUsername(e.getCardNo());
            u.setPassword(passwordEncoder.encode("Demo1234"));
            u.setRole(Role.EMPLOYEE);
            u.setEmployee(e);
            u.setActive(true);
            userRepository.save(u);
        }

        // 7. Generate Scans (Geçen ayın 1'inden bugüne kadar)
        LocalDate bugun = LocalDate.now();
        LocalDate start = bugun.minusMonths(1).withDayOfMonth(1);
        LocalDate end = bugun;
        
        int totalGenerated = 0;
        for (Employee e : emps) {
            com.pdks.backend.dto.SimulationRequest req = new com.pdks.backend.dto.SimulationRequest();
            req.setEmployeeId(e.getId());
            req.setStartDate(start);
            req.setEndDate(end);
            req.setSeed(2026 + e.getId().intValue());
            totalGenerated += simulatorService.simulate(req);
        }

        stats.put("createdEmployees", 8);
        stats.put("createdUsers", 5);
        stats.put("generatedScans", totalGenerated);

        return stats;
    }

    private Shift createShift(String firmId, String name, String start, String end,
                              String breakStart, String breakEnd, int lateTol, int earlyTol) {
        Shift s = new Shift();
        s.setFirmId(firmId);
        s.setName(name);
        s.setStartTime(LocalTime.parse(start));
        s.setEndTime(LocalTime.parse(end));
        s.setBreakStart(breakStart == null ? null : LocalTime.parse(breakStart));
        s.setBreakEnd(breakEnd == null ? null : LocalTime.parse(breakEnd));
        s.setLateToleranceMinutes(lateTol);
        s.setEarlyExitToleranceMinutes(earlyTol);
        s.setActive(true);
        return shiftRepository.save(s);
    }

    private Department createDept(String firmId, String name, String desc) {
        Department d = new Department();
        d.setFirmId(firmId);
        d.setName(name);
        d.setDescription(desc);
        d.setActive(true);
        return departmentRepository.save(d);
    }

    private Employee createEmp(String firmId, String fName, String lName, String cardNo, Department d, WorkGroup wg) {
        Employee e = new Employee();
        e.setFirmId(firmId);
        e.setFirstName(fName);
        e.setLastName(lName);
        e.setCardNo(cardNo);
        e.setDepartment(d);
        e.setWorkGroup(wg);
        e.setActive(true);
        return employeeRepository.save(e);
    }

    private WorkGroup createWgGunduz(String firmId, Shift gunduz) {
        WorkGroup wg = new WorkGroup();
        wg.setFirmId(firmId);
        wg.setName("Gündüz Ekibi");
        wg.setDailyWorkMinutes(480);
        wg.setActive(true);
        wg = workGroupRepository.save(wg);
        
        List<WorkGroupDay> days = new ArrayList<>();
        for (int i=1; i<=5; i++) days.add(new WorkGroupDay(null, wg, DayOfWeek.of(i), gunduz));
        days.add(new WorkGroupDay(null, wg, DayOfWeek.SATURDAY, null));
        days.add(new WorkGroupDay(null, wg, DayOfWeek.SUNDAY, null));
        wg.setDays(days);
        return workGroupRepository.save(wg);
    }

    private WorkGroup createWgGece(String firmId, Shift gece) {
        WorkGroup wg = new WorkGroup();
        wg.setFirmId(firmId);
        wg.setName("Gece Ekibi");
        wg.setDailyWorkMinutes(450);
        wg.setActive(true);
        wg = workGroupRepository.save(wg);
        
        List<WorkGroupDay> days = new ArrayList<>();
        for (int i=1; i<=5; i++) days.add(new WorkGroupDay(null, wg, DayOfWeek.of(i), gece));
        days.add(new WorkGroupDay(null, wg, DayOfWeek.SATURDAY, null));
        days.add(new WorkGroupDay(null, wg, DayOfWeek.SUNDAY, null));
        wg.setDays(days);
        return workGroupRepository.save(wg);
    }

    private WorkGroup createWgVardiyali(String firmId, Shift gunduz, Shift gece, Shift yarim) {
        WorkGroup wg = new WorkGroup();
        wg.setFirmId(firmId);
        wg.setName("Vardiyalı Ekip");
        wg.setDailyWorkMinutes(480);
        wg.setActive(true);
        wg = workGroupRepository.save(wg);
        
        List<WorkGroupDay> days = new ArrayList<>();
        for (int i=1; i<=3; i++) days.add(new WorkGroupDay(null, wg, DayOfWeek.of(i), gunduz));
        for (int i=4; i<=5; i++) days.add(new WorkGroupDay(null, wg, DayOfWeek.of(i), gece));
        days.add(new WorkGroupDay(null, wg, DayOfWeek.SATURDAY, yarim));
        days.add(new WorkGroupDay(null, wg, DayOfWeek.SUNDAY, null));
        wg.setDays(days);
        return workGroupRepository.save(wg);
    }

    private void createHolidays(String firmId, int year) {
        holidayRepository.save(new Holiday(null, firmId, LocalDate.of(year, 1, 1), "Yılbaşı", null));
        holidayRepository.save(new Holiday(null, firmId, LocalDate.of(year, 4, 23), "23 Nisan", null));
        holidayRepository.save(new Holiday(null, firmId, LocalDate.of(year, 5, 1), "1 Mayıs", null));
        holidayRepository.save(new Holiday(null, firmId, LocalDate.of(year, 5, 19), "19 Mayıs", null));
        holidayRepository.save(new Holiday(null, firmId, LocalDate.of(year, 8, 30), "30 Ağustos", null));
        holidayRepository.save(new Holiday(null, firmId, LocalDate.of(year, 10, 29), "29 Ekim", null));
    }
}
