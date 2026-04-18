package com.ipl.dashboard.model;

import com.opencsv.bean.CsvBindByName;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CsvBindByName(column = "match_id")
    private Long matchId;

    @CsvBindByName(column = "inning")
    private int inning;

    @CsvBindByName(column = "batting_team")
    private String battingTeam;

    @CsvBindByName(column = "bowling_team")
    private String bowlingTeam;

    @CsvBindByName(column = "over")
    private int over;

    @CsvBindByName(column = "ball")
    private int ball;

    @CsvBindByName(column = "batsman")
    private String batsman;

    @CsvBindByName(column = "bowler")
    private String bowler;

    @CsvBindByName(column = "batsman_runs")
    private int batsmanRuns;

    @CsvBindByName(column = "extra_runs")
    private int extraRuns;

    @CsvBindByName(column = "total_runs")
    private int totalRuns;

    @CsvBindByName(column = "player_dismissed")
    private String playerDismissed;
}
