package com.ipl.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HeadToHeadDto {
    private String team1;
    private String team2;
    private int totalMatches;
    private int team1Wins;
    private int team2Wins;
    private int noResults;
    private double team1WinPct;
    private double team2WinPct;
}
