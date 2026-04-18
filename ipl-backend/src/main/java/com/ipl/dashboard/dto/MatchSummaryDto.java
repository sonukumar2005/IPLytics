package com.ipl.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchSummaryDto {
    private Long id;
    private String opponent;
    private String date;
    private String venue;
    private String result; // "Win", "Loss", "Tie"
    private String playerOfMatch;

    // Frontend uses match.matchId — expose as alias
    @JsonProperty("matchId")
    public Long getMatchId() { return id; }
}
