package com.ipl.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InningScoreDto {
    private String battingTeam;
    private int runs;
    private int wickets;
    private double overs;
}
