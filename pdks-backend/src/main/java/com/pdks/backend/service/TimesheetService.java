package com.pdks.backend.service;

import com.pdks.backend.dto.admin.TimesheetResponse;
import com.pdks.backend.dto.TimesheetSummaryResponse;
import com.pdks.backend.entity.Shift;
import com.pdks.backend.entity.TransactionRecord;
import com.pdks.backend.entity.TransactionType;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.TransactionRecordRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimesheetService {

    private static final Logger log = LoggerFactory.getLogger(TimesheetService.class);

    private final UserRepository userRepository;
    private final TransactionRecordRepository transactionRepository;
    private final JwtService jwtService;

    public TimesheetResponse getTimesheet(String authHeader, Long userId, Integer year, Integer month) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));

        if (!user.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanıcının verilerine erişim yetkiniz yok.");
        }

        return calculateTimesheet(user, year, month);
    }

    public byte[] exportTimesheetCsv(String authHeader, Long userId, Integer year, Integer month) {
        TimesheetResponse ts = getTimesheet(authHeader, userId, year, month);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // Write UTF-8 BOM
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);

            try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
                // Header row
                writer.println("Tarih,Gun,Vardiya,IlkGiris,SonCikis,CalisilanSure,BeklenenSure,Fark,Durum,Not");

                for (TimesheetResponse.TimesheetDayInfo day : ts.getDays()) {
                    String formattedDate = "";
                    try {
                        LocalDate d = LocalDate.parse(day.getDate());
                        formattedDate = d.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
                    } catch (Exception e) {
                        formattedDate = day.getDate();
                    }

                    String shiftStr = ts.getShiftName() != null ? ts.getShiftName() : "-";
                    String firstIn = day.getFirstEntry() != null ? day.getFirstEntry() : "-";
                    String lastOut = day.getLastExit() != null ? day.getLastExit() : "-";

                    // Concat anomalies and manual notes if any
                    String notes = String.join(" | ", day.getAnomalies());

                    writer.println(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%d,\"%s\",\"%s\"",
                            formattedDate,
                            day.getDayOfWeek(),
                            shiftStr,
                            firstIn,
                            lastOut,
                            day.getWorkedMinutes(),
                            day.getExpectedMinutes(),
                            day.getDifferenceMinutes(),
                            day.getStatus(),
                            notes
                    ));
                }

                // Totals Row
                TimesheetResponse.TimesheetTotals totals = ts.getTotals();
                writer.println(String.format("\"TOPLAM\",\"-\",\"-\",\"-\",\"-\",%d,%d,%d,\"-\",\"Geciken Gun: %d | Eksik Cikis: %d | Devamsiz: %d\"",
                        totals.getWorkedMinutes(),
                        totals.getExpectedMinutes(),
                        totals.getDifferenceMinutes(),
                        totals.getLateDays(),
                        totals.getIncompleteDays(),
                        totals.getAbsentDays()
                ));

                writer.flush();
            }
            return baos.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "CSV oluşturulurken hata oluştu.", e);
        }
    }

    private TimesheetResponse calculateTimesheet(User user, Integer year, Integer month) {
        YearMonth ym = YearMonth.of(year, month);
        int totalDays = ym.lengthOfMonth();

        Shift shift = user.getShift();
        String shiftName = (shift != null) ? shift.getName() : null;

        // Determine timeframe (include next day morning in case of night shifts)
        LocalDateTime queryStart = ym.atDay(1).atStartOfDay();
        LocalDateTime queryEnd = ym.atEndOfMonth().atTime(23, 59, 59).plusDays(1).plusHours(12);

        List<TransactionRecord> allTx = transactionRepository.findByUserAndTimestampBetweenOrderByTimestampAsc(
                user, queryStart, queryEnd);

        log.debug("[TIMESHEET] user={} period={}/{} totalTxInMonth={}",
                user.getUsername(), year, month, allTx.size());

        List<TimesheetResponse.TimesheetDayInfo> dayList = new ArrayList<>();

        int totalWorked = 0;
        int totalExpected = 0;
        int totalDifference = 0;
        int lateDays = 0;
        int incompleteDays = 0;
        int absentDays = 0;

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter debugFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (int d = 1; d <= totalDays; d++) {
            LocalDate date = LocalDate.of(year, month, d);
            String dayOfWeekTurkish = getDayOfWeekTurkish(date.getDayOfWeek());

            // TODO: "ileride vardiyaya çalışma günleri alanı eklenebilir; şimdilik Pzt–Cum sabit"
            boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);
            boolean isFuture = date.isAfter(LocalDate.now());

            LocalDateTime windowStart;
            LocalDateTime windowEnd;

            // Night shift evaluation window
            if (shift != null && shift.getEndTime().isBefore(shift.getStartTime())) {
                windowStart = date.atTime(shift.getStartTime()).minusHours(4);
                windowEnd = date.plusDays(1).atTime(shift.getEndTime()).plusHours(4);
            } else if (shift != null) {
                // Normal day shift window
                windowStart = date.atStartOfDay();
                windowEnd = date.atTime(23, 59, 59);
            } else {
                // Default fallback
                windowStart = date.atStartOfDay();
                windowEnd = date.atTime(23, 59, 59);
            }

            // Filter transactions strictly falling inside this day's shift window
            List<TransactionRecord> dayTx = allTx.stream()
                    .filter(tx -> !tx.getTimestamp().isBefore(windowStart) && !tx.getTimestamp().isAfter(windowEnd))
                    .collect(Collectors.toList());

            // Debug: log all raw transactions for this day
            log.debug("[TIMESHEET] date={} window=[{} → {}] txCount={}",
                    date, windowStart.format(debugFmt), windowEnd.format(debugFmt), dayTx.size());
            for (int i = 0; i < dayTx.size(); i++) {
                TransactionRecord tx = dayTx.get(i);
                log.debug("[TIMESHEET]   tx[{}] id={} type={} ts={} manual={} note={}",
                        i, tx.getId(), tx.getType(), tx.getTimestamp().format(debugFmt),
                        tx.isManual(), tx.getManualNote());
            }

            // ── Pair-matching algorithm ──────────────────────────────────────────
            TransactionRecord firstEntry = null;  // earliest GİRİŞ that starts a pair
            TransactionRecord lastExit = null;    // latest ÇIKIŞ that closed a pair
            TransactionRecord activeGiris = null; // currently open (unmatched) GİRİŞ
            int workedMinutes = 0;
            int pairCount = 0;
            boolean hasIncomplete = false;
            List<String> anomalies = new ArrayList<>();

            for (TransactionRecord tx : dayTx) {
                // Collect manual notes for display
                if (tx.isManual() && tx.getManualNote() != null) {
                    anomalies.add("MANUAL: " + tx.getManualNote());
                }

                if (tx.getType() == TransactionType.GIRIS) {
                    if (activeGiris != null) {
                        // Consecutive GİRİŞ without a ÇIKIŞ between them — flag the dangling one
                        String anomalyMsg = "EŞLEŞMEYEn GİRİŞ: " + activeGiris.getTimestamp().format(timeFormatter);
                        anomalies.add(anomalyMsg);
                        hasIncomplete = true;
                        log.debug("[TIMESHEET]   PAIR-ANOMALY dangling-GIRIS at {} (replaced by {})",
                                activeGiris.getTimestamp().format(timeFormatter),
                                tx.getTimestamp().format(timeFormatter));
                        // Carry on with the later GİRİŞ as the new active one
                        activeGiris = tx;
                        // firstEntry is NOT updated — it always holds the very first GİRİŞ seen
                    } else {
                        activeGiris = tx;
                        if (firstEntry == null) {
                            firstEntry = tx; // record the very first GİRİŞ of the day
                        }
                        log.debug("[TIMESHEET]   PAIR-OPEN  GIRIS @ {}", tx.getTimestamp().format(timeFormatter));
                    }
                } else if (tx.getType() == TransactionType.CIKIS) {
                    if (activeGiris != null) {
                        // Happy path: matched pair
                        long pairMin = Duration.between(activeGiris.getTimestamp(), tx.getTimestamp()).toMinutes();
                        if (pairMin > 0) {
                            workedMinutes += (int) pairMin;
                            pairCount++;
                            // lastExit tracks the latest closing ÇIKIŞ across all pairs
                            lastExit = tx;
                            log.debug("[TIMESHEET]   PAIR-CLOSE {} → {} = {}min (running total={}min)",
                                    activeGiris.getTimestamp().format(timeFormatter),
                                    tx.getTimestamp().format(timeFormatter),
                                    pairMin, workedMinutes);
                        } else {
                            String anomalyMsg = "GEÇERSİZ ÇİFT (çıkış girişten önce): " + tx.getTimestamp().format(timeFormatter);
                            anomalies.add(anomalyMsg);
                            log.debug("[TIMESHEET]   PAIR-INVALID exit before entry at {}", tx.getTimestamp().format(timeFormatter));
                        }
                        activeGiris = null;
                    } else {
                        // Orphan ÇIKIŞ with no preceding GİRİŞ
                        String anomalyMsg = "EŞLEŞMEYEn ÇIKIŞ: " + tx.getTimestamp().format(timeFormatter);
                        anomalies.add(anomalyMsg);
                        hasIncomplete = true;
                        // Still track it for lastExit so the UI can show a time reference
                        if (lastExit == null || tx.getTimestamp().isAfter(lastExit.getTimestamp())) {
                            lastExit = tx;
                        }
                        log.debug("[TIMESHEET]   PAIR-ANOMALY orphan-CIKIS at {}", tx.getTimestamp().format(timeFormatter));
                    }
                }
            }

            // Any still-open GİRİŞ at end of day = incomplete
            if (activeGiris != null) {
                String anomalyMsg = "EŞLEŞMEYEn GİRİŞ (kapanmadı): " + activeGiris.getTimestamp().format(timeFormatter);
                anomalies.add(anomalyMsg);
                hasIncomplete = true;
                // If there were already completed pairs, keep their time; otherwise 0
                if (pairCount == 0) {
                    workedMinutes = 0;
                }
                log.debug("[TIMESHEET]   PAIR-ANOMALY unclosed-GIRIS at {} pairCount={} workedSoFar={}",
                        activeGiris.getTimestamp().format(timeFormatter), pairCount, workedMinutes);
            }

            // ── Break deduction ──────────────────────────────────────────────────
            // FIX: NO break deduction on WEEKEND_WORK — break rules are workday-only
            if (pairCount > 0 && !isWeekend) {
                int breakMin = (shift != null) ? shift.getBreakMinutes() : 0;
                int before = workedMinutes;
                if (workedMinutes >= 240) {
                    workedMinutes = Math.max(240, workedMinutes - breakMin);
                }
                log.debug("[TIMESHEET]   BREAK deducted={}min ({} → {}min)", breakMin, before, workedMinutes);
            } else if (pairCount > 0 && isWeekend) {
                log.debug("[TIMESHEET]   BREAK skipped (weekend) workedMinutes={}min", workedMinutes);
            }

            // ── Expected minutes ─────────────────────────────────────────────────
            // A1: Expected = 0 on weekends
            int expectedMinutes = 0;
            if (!isWeekend && shift != null) {
                long shiftMin = Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
                if (shiftMin < 0) {
                    shiftMin += 24 * 60; // night shift crosses midnight
                }
                expectedMinutes = Math.max(0, (int) shiftMin - shift.getBreakMinutes());
            }

            int differenceMinutes = workedMinutes - expectedMinutes;

            // ── Late evaluation ── only on workdays ──────────────────────────────
            int lateMinutes = 0;
            if (!isWeekend && shift != null && firstEntry != null) {
                LocalDateTime shiftStartDateTime = date.atTime(shift.getStartTime());
                LocalDateTime entryDateTime = firstEntry.getTimestamp();
                if (entryDateTime.isAfter(shiftStartDateTime.plusMinutes(shift.getLateToleranceMinutes()))) {
                    lateMinutes = (int) Duration.between(shiftStartDateTime, entryDateTime).toMinutes();
                    log.debug("[TIMESHEET]   LATE lateMinutes={} (entry={} shiftStart={})",
                            lateMinutes, entryDateTime.format(timeFormatter),
                            shiftStartDateTime.format(timeFormatter));
                }
            }

            // ── Status resolution ────────────────────────────────────────────────
            String status;
            if (firstEntry == null && lastExit == null) {
                // No records at all
                if (isFuture || isWeekend) {
                    status = "NO_DATA";
                } else {
                    status = "ABSENT";
                    absentDays++;
                }
            } else if (isWeekend) {
                // Weekend with any records → WEEKEND_WORK (no LATE/INCOMPLETE penalties)
                status = "WEEKEND_WORK";
            } else {
                // Workday with records
                if (hasIncomplete) {
                    status = "INCOMPLETE";
                    incompleteDays++;
                } else if (lateMinutes > 0) {
                    status = "LATE";
                    lateDays++;
                } else {
                    status = "COMPLETE";
                }
            }

            log.debug("[TIMESHEET]   RESULT date={} firstEntry={} lastExit={} worked={}min expected={}min diff={}min status={} pairs={} incomplete={}",
                    date,
                    firstEntry != null ? firstEntry.getTimestamp().format(timeFormatter) : "null",
                    lastExit  != null ? lastExit.getTimestamp().format(timeFormatter)  : "null",
                    workedMinutes, expectedMinutes, differenceMinutes, status, pairCount, hasIncomplete);

            totalWorked   += workedMinutes;
            totalExpected += expectedMinutes;  // weekend expectedMinutes is always 0

            String firstEntryStr = (firstEntry != null) ? firstEntry.getTimestamp().format(timeFormatter) : null;
            String lastExitStr   = (lastExit  != null) ? lastExit.getTimestamp().format(timeFormatter)  : null;

            dayList.add(TimesheetResponse.TimesheetDayInfo.builder()
                    .date(date.toString())
                    .dayOfWeek(dayOfWeekTurkish)
                    .firstEntry(firstEntryStr)
                    .lastExit(lastExitStr)
                    .workedMinutes(workedMinutes)
                    .expectedMinutes(expectedMinutes)
                    .differenceMinutes(differenceMinutes)
                    .status(status)
                    .lateMinutes(lateMinutes)
                    .anomalies(anomalies)
                    .build());
        }

        totalDifference = totalWorked - totalExpected;

        return TimesheetResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .shiftName(shiftName)
                .year(year)
                .month(month)
                .days(dayList)
                .totals(TimesheetResponse.TimesheetTotals.builder()
                        .workedMinutes(totalWorked)
                        .expectedMinutes(totalExpected)
                        .differenceMinutes(totalDifference)
                        .lateDays(lateDays)
                        .incompleteDays(incompleteDays)
                        .absentDays(absentDays)
                        .build())
                .build();
    }

    private String getDayOfWeekTurkish(DayOfWeek day) {
        switch (day) {
            case MONDAY:    return "Pazartesi";
            case TUESDAY:   return "Salı";
            case WEDNESDAY: return "Çarşamba";
            case THURSDAY:  return "Perşembe";
            case FRIDAY:    return "Cuma";
            case SATURDAY:  return "Cumartesi";
            case SUNDAY:    return "Pazar";
            default:        return "";
        }
    }

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadı.");
        }
        String token = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7)
                : bearerToken;

        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı."));
    }

    public TimesheetSummaryResponse getMyTimesheetSummary(String authHeader) {
        User user = getUserFromToken(authHeader);
        ZoneId turkeyZone = ZoneId.of("Europe/Istanbul");
        LocalDate today = LocalDate.now(turkeyZone);
        int year = today.getYear();
        int month = today.getMonthValue();

        TimesheetResponse fullTs = calculateTimesheet(user, year, month);

        return TimesheetSummaryResponse.builder()
                .month(month)
                .year(year)
                .workedMinutes(fullTs.getTotals().getWorkedMinutes())
                .expectedMinutes(fullTs.getTotals().getExpectedMinutes())
                .lateDays(fullTs.getTotals().getLateDays())
                .incompleteDays(fullTs.getTotals().getIncompleteDays())
                .shiftName(fullTs.getShiftName())
                .build();
    }
}
