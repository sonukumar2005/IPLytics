package com.ipl.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PointsTableEntry {
    private String teamName;
    private String teamLogo;
    private int matchesPlayed;
    private int wins;
    private int losses;
    private int points;
    private double netRunRate;

    // Alias so frontend can use row.logo consistently
    @JsonProperty("logo")
    public String getLogo() {
        return teamLogo;
    }
}
