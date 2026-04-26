package com.ipl.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PredictResponse {
    private String team1;
    private String team2;
    private double team1Probability;
    private double team2Probability;
    private String predictedWinner;
    // Optional: error message when ML service is down
    private String error;
}
