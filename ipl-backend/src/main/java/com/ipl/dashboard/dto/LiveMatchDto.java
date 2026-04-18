package com.ipl.dashboard.dto;

public class LiveMatchDto {
    private String battingTeam;
    private String bowlingTeam;
    private int runs;
    private int wickets;
    private double overs;
    private String currentBatsman;
    private int batsmanRuns;
    private int batsmanBalls;
    private String currentBowler;
    private String bowlerStats;

    public LiveMatchDto(String battingTeam, String bowlingTeam, int runs, int wickets, double overs, String currentBatsman, int batsmanRuns, int batsmanBalls, String currentBowler, String bowlerStats) {
        this.battingTeam = battingTeam;
        this.bowlingTeam = bowlingTeam;
        this.runs = runs;
        this.wickets = wickets;
        this.overs = overs;
        this.currentBatsman = currentBatsman;
        this.batsmanRuns = batsmanRuns;
        this.batsmanBalls = batsmanBalls;
        this.currentBowler = currentBowler;
        this.bowlerStats = bowlerStats;
    }

    // Getters and Setters
    public String getBattingTeam() { return battingTeam; }
    public void setBattingTeam(String battingTeam) { this.battingTeam = battingTeam; }
    public String getBowlingTeam() { return bowlingTeam; }
    public void setBowlingTeam(String bowlingTeam) { this.bowlingTeam = bowlingTeam; }
    public int getRuns() { return runs; }
    public void setRuns(int runs) { this.runs = runs; }
    public int getWickets() { return wickets; }
    public void setWickets(int wickets) { this.wickets = wickets; }
    public double getOvers() { return overs; }
    public void setOvers(double overs) { this.overs = overs; }
    public String getCurrentBatsman() { return currentBatsman; }
    public void setCurrentBatsman(String currentBatsman) { this.currentBatsman = currentBatsman; }
    public int getBatsmanRuns() { return batsmanRuns; }
    public void setBatsmanRuns(int batsmanRuns) { this.batsmanRuns = batsmanRuns; }
    public int getBatsmanBalls() { return batsmanBalls; }
    public void setBatsmanBalls(int batsmanBalls) { this.batsmanBalls = batsmanBalls; }
    public String getCurrentBowler() { return currentBowler; }
    public void setCurrentBowler(String currentBowler) { this.currentBowler = currentBowler; }
    public String getBowlerStats() { return bowlerStats; }
    public void setBowlerStats(String bowlerStats) { this.bowlerStats = bowlerStats; }
}
