package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Personel kayıt yanıtı — istemciye dönen veri.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {

    private Long id;
    private String firmId;
    private String firstName;
    private String lastName;
    private String cardNo;
    private boolean active;
    private Long workGroupId;
    private String workGroupName;
    private Long departmentId;
    private String departmentName;
    private LocalDateTime createdAt;
}
