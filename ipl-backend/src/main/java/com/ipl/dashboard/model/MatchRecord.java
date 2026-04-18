package com.ipl.dashboard.model;

import com.opencsv.bean.CsvBindByName;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchRecord {

    @Id
    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "season")
    @Column(name = "season_year")
    private int year;

    @CsvBindByName(column = "city")
    private String city;

    @CsvBindByName(column = "date")
    private String date;

    @CsvBindByName(column = "team1")
    private String team1;

    @CsvBindByName(column = "team2")
    private String team2;

    @CsvBindByName(column = "toss_winner")
    private String tossWinner;

    @CsvBindByName(column = "toss_decision")
    private String tossDecision;

    @CsvBindByName(column = "result")
    private String result;

    @CsvBindByName(column = "dl_applied")
    private int dlApplied;

    @CsvBindByName(column = "winner")
    private String matchWinner;

    @CsvBindByName(column = "win_by_runs")
    private int winByRuns;

    @CsvBindByName(column = "win_by_wickets")
    private int winByWickets;

    @CsvBindByName(column = "player_of_match")
    private String playerOfMatch;

    @CsvBindByName(column = "venue")
    private String venue;

    @CsvBindByName(column = "umpire1")
    private String umpire1;

    @CsvBindByName(column = "umpire2")
    private String umpire2;

    @CsvBindByName(column = "umpire3")
    private String umpire3;
}