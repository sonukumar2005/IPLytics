package com.ipl.dashboard.service;

import com.ipl.dashboard.dto.LiveMatchDto;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class LiveDataService {

    private static final String API_KEY = "AcEwrhOb6Ta2P5v9Ca6VHz";

    public List<LiveMatchDto> getLiveMatches() {
        List<LiveMatchDto> liveMatches = new ArrayList<>();

        try {
            RestTemplate restTemplate = new RestTemplate();

            // 🔥 Step 1: Fetch LIVE matches first
            String liveUrl = "https://api.cricapi.com/v1/currentMatches?apikey=" + API_KEY;

            String response = restTemplate.getForObject(liveUrl, String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);

            JsonNode data = root.path("data");

            // ================= LIVE MATCHES =================
            for (JsonNode match : data) {

                String status = match.path("status").asText("").toLowerCase();

                // Only LIVE matches
                if (!status.contains("live")) continue;

                LiveMatchDto dto = extractMatch(match);

                if (dto != null) {
                    liveMatches.add(dto);
                }
            }

            // ================= FALLBACK (RECENT) =================
            if (liveMatches.isEmpty()) {

                String recentUrl = "https://api.cricapi.com/v1/matches?apikey=" + API_KEY;

                String recentResponse = restTemplate.getForObject(recentUrl, String.class);

                JsonNode recentRoot = mapper.readTree(recentResponse);
                JsonNode recentData = recentRoot.path("data");

                int count = 0;

                for (JsonNode match : recentData) {

                    LiveMatchDto dto = extractMatch(match);

                    if (dto != null) {
                        liveMatches.add(dto);
                        count++;
                    }

                    if (count >= 5) break; // limit results
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return liveMatches;
    }

    // ================= HELPER METHOD =================
    private LiveMatchDto extractMatch(JsonNode match) {

        JsonNode teamsNode = match.path("teams");

        if (!teamsNode.isArray() || teamsNode.size() < 2) {
            return null;
        }

        String team1 = teamsNode.get(0).asText();
        String team2 = teamsNode.get(1).asText();

        // 🔥 IPL FILTER
        String name = match.path("name").asText("").toLowerCase();

        if (!(name.contains("ipl") ||
            name.contains("indian premier league"))) {
            return null; // skip non-IPL matches
        }

        String status = match.path("status").asText("No Status");

        int runs = 0;
        int wickets = 0;
        double overs = 0.0;

        JsonNode scoreArray = match.path("score");

        if (scoreArray.isArray() && scoreArray.size() > 0) {
            JsonNode innings = scoreArray.get(0);

            runs = innings.path("r").asInt(0);
            wickets = innings.path("w").asInt(0);
            overs = innings.path("o").asDouble(0.0);
        }

        return new LiveMatchDto(
                team1,
                team2,
                runs,
                wickets,
                overs,
                status,
                runs,
                0,
                "Live",
                wickets + " wkts"
        );
    }
}