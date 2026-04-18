package com.ipl.dashboard.service;

import com.ipl.dashboard.model.MatchRecord;
import com.ipl.dashboard.model.DeliveryRecord;
import com.ipl.dashboard.repository.MatchRecordRepository;
import com.ipl.dashboard.repository.DeliveryRepository;
import com.ipl.dashboard.util.CsvDataParser;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStreamReader;
import java.util.List;

@Service
public class DataLoaderService {

    private final MatchRecordRepository matchRepository;
    private final DeliveryRepository deliveryRepository;
    private final CsvDataParser parser;
    private final ResourceLoader resourceLoader;

    public DataLoaderService(MatchRecordRepository matchRepository,
                             DeliveryRepository deliveryRepository,
                             CsvDataParser parser,
                             ResourceLoader resourceLoader) {
        this.matchRepository = matchRepository;
        this.deliveryRepository = deliveryRepository;
        this.parser = parser;
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void loadData() {
        try {
            loadMatches();
            loadDeliveries();
        } catch (Exception e) {
            System.err.println("❌ Failed to load data: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ==================== LOAD MATCHES ====================
    private void loadMatches() {
        try {
            Resource resource = resourceLoader.getResource("classpath:data/matches.csv");

            if (!resource.exists()) {
                System.err.println("❌ matches.csv not found!");
                return;
            }

            InputStreamReader reader = new InputStreamReader(resource.getInputStream());
            List<MatchRecord> matches = parser.parseMatchCsv(reader);

            if (matches.isEmpty()) {
                System.err.println("⚠️ No match records found. Check CSV format.");
                return;
            }

            matchRepository.deleteAll();
            matchRepository.saveAll(matches);

            System.out.println("✅ Matches Loaded: " + matches.size() +
                    " | Seasons: " +
                    matches.stream().map(MatchRecord::getYear).distinct().count());

        } catch (Exception e) {
            System.err.println("❌ Error loading matches.csv");
            e.printStackTrace();
        }
    }

    // ==================== LOAD DELIVERIES ====================
    private void loadDeliveries() {
        try {
            Resource resource = resourceLoader.getResource("classpath:data/deliveries.csv");

            if (!resource.exists()) {
                System.err.println("⚠️ deliveries.csv not found (optional)");
                return;
            }

            InputStreamReader reader = new InputStreamReader(resource.getInputStream());
            List<DeliveryRecord> deliveries = parser.parseDeliveryCsv(reader);

            if (deliveries.isEmpty()) {
                System.err.println("⚠️ No delivery records found.");
                return;
            }

            deliveryRepository.saveAll(deliveries);

            System.out.println("✅ Deliveries Loaded: " + deliveries.size());

        } catch (Exception e) {
            System.err.println("❌ Error loading deliveries.csv");
            e.printStackTrace();
        }
    }
}