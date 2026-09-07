package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Gun icindeki tek bir calisma araligi (giris-cikis cifti). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkIntervalDto {

    private LocalDateTime entryTime;

    /** Eslesmemis son okutmada null. */
    private LocalDateTime exitTime;

    /** Mola kesisimi dusulmus net sure; eslesmemis okutmada 0. */
    private int minutes;
}
