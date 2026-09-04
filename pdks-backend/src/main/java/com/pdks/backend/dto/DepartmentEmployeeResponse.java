package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DepartmentEmployeeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String cardNo;
    private String workGroupName;
    private boolean hasAccount;
}
