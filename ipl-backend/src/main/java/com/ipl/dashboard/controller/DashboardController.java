package com.ipl.dashboard.controller;

import com.ipl.dashboard.dto.*;
import com.ipl.dashboard.service.DashboardService;
import com.ipl.dashboard.service.LiveDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;
    private final LiveDataService liveDataService;

    public DashboardController(DashboardService dashboardService, LiveDataService liveDataService) {
        this.dashboardService = dashboardService;
        this.liveDataService = liveDataService;
    }

    // ==================== LIVE ====================

    @GetMapping("/live-matches")
    public List<LiveMatchDto> getLiveMatches() {
        return liveDataService.getLiveMatches();
    }

    // 🔥 Combined endpoint (LIVE + HISTORY)
    @GetMapping("/dashboard-live")
    public Map<String, Object> getDashboardLive() {
        return Map.of(
                "liveMatches", liveDataService.getLiveMatches(),
                "seasons", dashboardService.getSeasonSummaries(),
                "teams", dashboardService.getTeams()
        );
    }

    // ==================== YEARS / SEASONS ====================

    @GetMapping("/years")
    public List<Integer> getYears() {
        return dashboardService.getIplYears();
    }

    @GetMapping("/seasons")
    public List<SeasonSummaryDto> getSeasons() {
        return dashboardService.getSeasonSummaries();
    }

    // ==================== POINTS TABLE ====================

    @GetMapping("/points-table/{year}")
    public List<PointsTableEntry> getPointsTable(@PathVariable int year) {
        return dashboardService.getPointsTable(year);
    }

    // ==================== TEAM MATCHES ====================

    @GetMapping("/team-matches/{team}/{year}")
    public List<MatchSummaryDto> getTeamMatches(@PathVariable String team, @PathVariable int year) {
        return dashboardService.getTeamMatches(team, year);
    }

    // Legacy alias
    @GetMapping("/matches/{team}/{year}")
    public List<MatchSummaryDto> getTeamMatchesLegacy(@PathVariable String team, @PathVariable int year) {
        return dashboardService.getTeamMatches(team, year);
    }

    // ==================== MATCH DETAILS ====================

    @GetMapping("/match/{id}")
    public MatchDetailsDto getMatchDetails(@PathVariable Long id) {
        return dashboardService.getMatchDetails(id);
    }

    // ==================== HEAD TO HEAD ====================

    @GetMapping("/head-to-head")
    public HeadToHeadDto getHeadToHead(
            @RequestParam String team1,
            @RequestParam String team2) {
        return dashboardService.getHeadToHead(team1, team2);
    }

    // ==================== VENUES ====================

    @GetMapping("/venues")
    public List<VenueDto> getVenues() {
        return dashboardService.getVenues();
    }

    @GetMapping("/venue-stats")
    public List<VenueDto> getVenueStats() {
        return dashboardService.getVenues();
    }

    @GetMapping("/venues-list")
    public List<String> getVenuesList() {
        return dashboardService.getUniqueVenues();
    }

    // ==================== TEAMS ====================

    @GetMapping("/teams")
    public List<String> getTeams() {
        return dashboardService.getTeams();
    }

    // ==================== CHARTS ====================

    @GetMapping("/league-stats/{year}")
    public List<PerformanceChartDto> getLeagueStats(@PathVariable int year) {
        return dashboardService.getLeagueStats(year);
    }

    @GetMapping("/stats/{year}")
    public List<PerformanceChartDto> getLeagueStatsAlias(@PathVariable int year) {
        return dashboardService.getLeagueStats(year);
    }

    // ==================== ML PREDICTION ====================

    @PostMapping("/predict")
    public Map<String, Object> predict(@RequestBody PredictRequest request) {
        return dashboardService.predictMatch(request);
    }
}