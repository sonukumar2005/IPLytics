package com.ipl.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SeasonSummaryDto {
    private int year;
    private String winner;
    private String runnerUp;
    private int totalMatches;
    private String logo;
}
