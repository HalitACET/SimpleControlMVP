package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ScanHistoryPage {
    private List<ScanHistoryItem> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
