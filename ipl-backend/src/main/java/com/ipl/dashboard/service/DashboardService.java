package com.ipl.dashboard.service;

import com.ipl.dashboard.dto.*;
import com.ipl.dashboard.model.MatchRecord;
import com.ipl.dashboard.repository.MatchRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final MatchRecordRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String ML_API_URL = "http://localhost:5000/predict";

    // Real IPL venue coordinates
    private static final Map<String, double[]> VENUE_COORDS = new HashMap<>();
    static {
        VENUE_COORDS.put("Wankhede Stadium", new double[]{18.9388, 72.8258});
        VENUE_COORDS.put("M Chinnaswamy Stadium", new double[]{12.9792, 77.5997});
        VENUE_COORDS.put("M.Chinnaswamy Stadium", new double[]{12.9792, 77.5997});
        VENUE_COORDS.put("Eden Gardens", new double[]{22.5645, 88.3433});
        VENUE_COORDS.put("MA Chidambaram Stadium", new double[]{13.0604, 80.2791});
        VENUE_COORDS.put("Narendra Modi Stadium", new double[]{23.0906, 72.0789});
        VENUE_COORDS.put("Arun Jaitley Stadium", new double[]{28.6366, 77.2231});
        VENUE_COORDS.put("Rajiv Gandhi International Stadium", new double[]{17.4062, 78.5492});
        VENUE_COORDS.put("Punjab Cricket Association IS Bindra Stadium", new double[]{30.6839, 76.8116});
        VENUE_COORDS.put("Sawai Mansingh Stadium", new double[]{26.8945, 75.8047});
        VENUE_COORDS.put("Ekana Cricket Stadium", new double[]{26.8467, 80.9462});
        VENUE_COORDS.put("Dr DY Patil Sports Academy", new double[]{19.0430, 73.0297});
        VENUE_COORDS.put("Brabourne Stadium", new double[]{18.9335, 72.8258});
        VENUE_COORDS.put("Dubai International Cricket Stadium", new double[]{25.0478, 55.1874});
        VENUE_COORDS.put("Sheikh Zayed Stadium", new double[]{24.4667, 54.3667});
        VENUE_COORDS.put("Sharjah Cricket Stadium", new double[]{25.3467, 55.4013});
        VENUE_COORDS.put("Maharashtra Cricket Association Stadium", new double[]{18.6509, 73.7851});
        VENUE_COORDS.put("Himachal Pradesh Cricket Association Stadium", new double[]{31.1048, 77.1734});
    }

    // IPL champions by year
    private static final Map<Integer, String> IPL_CHAMPIONS = new HashMap<>();
    static {
        IPL_CHAMPIONS.put(2008, "Rajasthan Royals");
        IPL_CHAMPIONS.put(2009, "Deccan Chargers");
        IPL_CHAMPIONS.put(2010, "Chennai Super Kings");
        IPL_CHAMPIONS.put(2011, "Chennai Super Kings");
        IPL_CHAMPIONS.put(2012, "Kolkata Knight Riders");
        IPL_CHAMPIONS.put(2013, "Mumbai Indians");
        IPL_CHAMPIONS.put(2014, "Kolkata Knight Riders");
        IPL_CHAMPIONS.put(2015, "Mumbai Indians");
        IPL_CHAMPIONS.put(2016, "Sunrisers Hyderabad");
        IPL_CHAMPIONS.put(2017, "Mumbai Indians");
        IPL_CHAMPIONS.put(2018, "Chennai Super Kings");
        IPL_CHAMPIONS.put(2019, "Mumbai Indians");
        IPL_CHAMPIONS.put(2020, "Mumbai Indians");
        IPL_CHAMPIONS.put(2021, "Chennai Super Kings");
        IPL_CHAMPIONS.put(2022, "Gujarat Titans");
        IPL_CHAMPIONS.put(2023, "Chennai Super Kings");
        IPL_CHAMPIONS.put(2024, "Kolkata Knight Riders");
        IPL_CHAMPIONS.put(2025, "TBD");
    }

    public DashboardService(MatchRecordRepository repository) {
        this.repository = repository;
    }

    // ==================== ML PREDICTION ====================

    public Map<String, Object> predictMatch(PredictRequest request) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = restTemplate.postForObject(ML_API_URL, request, Map.class);
            return result;
        } catch (Exception e) {
            return Map.of("error", "ML Service Unavailable", "details", e.getMessage());
        }
    }

    // ==================== YEARS + SEASONS ====================

    public List<Integer> getIplYears() {
        List<Integer> dbYears = repository.findDistinctSeasons();
        // Merge with known IPL years so the grid is always populated
        Set<Integer> allYears = new TreeSet<>(Comparator.reverseOrder());
        allYears.addAll(dbYears);
        // Only add years up to current year from static map
        allYears.addAll(IPL_CHAMPIONS.keySet().stream()
                .filter(y -> y <= 2025)
                .collect(Collectors.toList()));
        return new ArrayList<>(allYears);
    }

    public List<SeasonSummaryDto> getSeasonSummaries() {
        List<Integer> years = getIplYears();
        List<SeasonSummaryDto> summaries = new ArrayList<>();
        for (int year : years) {
            String champion = IPL_CHAMPIONS.getOrDefault(year, determineChampionFromData(year));
            String logo = "/logos/" + slugify(champion) + ".png";
            long matchCount = repository.findByYear(year).size();
            summaries.add(new SeasonSummaryDto(year, champion, "", (int) matchCount, logo));
        }
        return summaries;
    }

    private String determineChampionFromData(int year) {
        List<MatchRecord> matches = repository.findByYear(year);
        if (matches.isEmpty()) return "TBD";
        // The last match of the season is typically the final
        return matches.stream()
                .max(Comparator.comparing(MatchRecord::getDate))
                .map(MatchRecord::getMatchWinner)
                .orElse("TBD");
    }

    // ==================== POINTS TABLE ====================

    public List<PointsTableEntry> getPointsTable(int year) {
        List<MatchRecord> matches = repository.findByYear(year);
        Map<String, PointsTableEntry> table = new TreeMap<>();

        for (MatchRecord match : matches) {
            updateEntry(table, match.getTeam1(), match);
            updateEntry(table, match.getTeam2(), match);
        }

        List<PointsTableEntry> sortedEntries = new ArrayList<>(table.values());
        sortedEntries.sort((a, b) -> {
            if (b.getPoints() != a.getPoints())
                return b.getPoints() - a.getPoints();
            return Double.compare(b.getNetRunRate(), a.getNetRunRate());
        });

        return sortedEntries;
    }

    private void updateEntry(Map<String, PointsTableEntry> table, String team, MatchRecord match) {
        PointsTableEntry entry = table.computeIfAbsent(team,
                t -> new PointsTableEntry(t, "/logos/" + slugify(t) + ".png", 0, 0, 0, 0, 0.0));
        entry.setMatchesPlayed(entry.getMatchesPlayed() + 1);
        if (team.equals(match.getMatchWinner())) {
            entry.setWins(entry.getWins() + 1);
            entry.setPoints(entry.getPoints() + 2);
        } else if (!"tie".equalsIgnoreCase(match.getResult()) && !"no result".equalsIgnoreCase(match.getResult())) {
            entry.setLosses(entry.getLosses() + 1);
        } else {
            entry.setPoints(entry.getPoints() + 1);
        }
        // Approximate NRR
        entry.setNetRunRate(Math.round((entry.getWins() - entry.getLosses()) * 0.1 * 1000.0) / 1000.0);
    }

    // ==================== TEAM MATCHES ====================

    public List<MatchSummaryDto> getTeamMatches(String team, int year) {
        return repository.findByTeamAndYear(team, year)
                .stream()
                .map(m -> new MatchSummaryDto(
                        m.getId(),
                        team.equals(m.getTeam1()) ? m.getTeam2() : m.getTeam1(),
                        m.getDate(),
                        m.getVenue(),
                        team.equals(m.getMatchWinner())
                                ? "Win"
                                : ("tie".equalsIgnoreCase(m.getResult()) ? "Tie" : "Loss"),
                        m.getPlayerOfMatch()
                ))
                .collect(Collectors.toList());
    }

    // ==================== MATCH DETAILS ====================

    public MatchDetailsDto getMatchDetails(Long id) {
        return repository.findById(id)
                .map(m -> new MatchDetailsDto(
                        m.getId(),
                        m.getTeam1(),
                        m.getTeam2(),
                        m.getVenue(),
                        m.getTossWinner(),
                        m.getTossDecision(),
                        m.getDate(),
                        m.getMatchWinner(),
                        m.getWinByRuns() > 0
                                ? m.getWinByRuns() + " Runs"
                                : m.getWinByWickets() + " Wickets",
                        m.getPlayerOfMatch(),
                        Collections.emptyList()))
                .orElse(null);
    }

    // ==================== HEAD TO HEAD ====================

    public HeadToHeadDto getHeadToHead(String team1, String team2) {
        List<MatchRecord> all = repository.findAll();
        List<MatchRecord> h2h = all.stream()
                .filter(m -> (m.getTeam1().equalsIgnoreCase(team1) && m.getTeam2().equalsIgnoreCase(team2))
                        || (m.getTeam1().equalsIgnoreCase(team2) && m.getTeam2().equalsIgnoreCase(team1)))
                .collect(Collectors.toList());

        int team1Wins = 0, team2Wins = 0, noResults = 0;
        for (MatchRecord m : h2h) {
            if (m.getMatchWinner() == null || m.getMatchWinner().isBlank()) {
                noResults++;
            } else if (m.getMatchWinner().equalsIgnoreCase(team1)) {
                team1Wins++;
            } else if (m.getMatchWinner().equalsIgnoreCase(team2)) {
                team2Wins++;
            } else {
                noResults++;
            }
        }

        int total = h2h.size();
        double t1Pct = total > 0 ? Math.round(((double) team1Wins / total) * 1000.0) / 10.0 : 0;
        double t2Pct = total > 0 ? Math.round(((double) team2Wins / total) * 1000.0) / 10.0 : 0;

        return new HeadToHeadDto(team1, team2, total, team1Wins, team2Wins, noResults, t1Pct, t2Pct);
    }

    // ==================== VENUES ====================

    public List<VenueDto> getVenues() {
        return repository.findAll().stream()
                .collect(Collectors.groupingBy(MatchRecord::getVenue, Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    double[] coords = VENUE_COORDS.getOrDefault(e.getKey(),
                            new double[]{20.0 + (Math.random() * 5), 75.0 + (Math.random() * 5)});
                    return new VenueDto(e.getKey(), coords[0], coords[1], e.getValue());
                })
                .collect(Collectors.toList());
    }

    // ==================== CHARTS ====================

    public List<PerformanceChartDto> getLeagueStats(int year) {
        List<PointsTableEntry> table = getPointsTable(year);
        return table.stream()
                .map(e -> new PerformanceChartDto(e.getTeamName(), e.getWins(), "#eab308"))
                .collect(Collectors.toList());
    }

    // ==================== TEAMS & VENUES LISTS ====================

    public List<String> getTeams() {
        return repository.findAll().stream()
                .flatMap(m -> java.util.stream.Stream.of(m.getTeam1(), m.getTeam2()))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getUniqueVenues() {
        return repository.findAll().stream()
                .map(MatchRecord::getVenue)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    // ==================== HYBRID LIVE DATA ====================

    public Map<String, Object> getLiveHybrid() {
        // This is a placeholder - real implementation would call Cricbuzz API first
        // then fall back to CSV data
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("source", "csv_fallback");
        response.put("status", "No live match currently");
        response.put("lastUpdated", java.time.LocalDateTime.now().toString());
        List<MatchRecord> recent = repository.findAll().stream()
                .sorted(Comparator.comparing(MatchRecord::getDate).reversed())
                .limit(3)
                .map(m -> m)
                .collect(Collectors.toList());
        response.put("recentMatches", recent.stream().map(m -> Map.of(
                "id", m.getId(),
                "team1", m.getTeam1(),
                "team2", m.getTeam2(),
                "winner", m.getMatchWinner() != null ? m.getMatchWinner() : "TBD",
                "date", m.getDate().toString(),
                "venue", m.getVenue()
        )).collect(Collectors.toList()));
        return response;
    }

    // ==================== HELPER ====================

    private String slugify(String name) {
        if (name == null) return "unknown";
        return name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
