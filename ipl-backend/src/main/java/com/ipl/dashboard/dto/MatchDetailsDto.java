package com.ipl.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchDetailsDto {

    private Long id;
    private String team1;
    private String team2;
    private String venue;
    private String tossWinner;
    private String tossDecision;
    private String date;
    private String matchWinner;      // used by frontend
    private String resultMargin;     // e.g. "63 Runs" or "6 Wickets"
    private String playerOfMatch;
    private List<String> highlights;

    // Backward-compat aliases
    @JsonProperty("winner")
    public String getWinner() { return matchWinner; }

    @JsonProperty("result")
    public String getResult() { return resultMargin; }
}