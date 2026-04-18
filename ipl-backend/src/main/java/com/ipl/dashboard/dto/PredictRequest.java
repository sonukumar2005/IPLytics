package com.ipl.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PredictRequest {
    private String team1;
    private String team2;
    private String venue;
    private String tossWinner;
    private String tossDecision;
}
