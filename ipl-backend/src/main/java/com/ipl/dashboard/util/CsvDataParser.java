package com.ipl.dashboard.util;

import com.ipl.dashboard.model.DeliveryRecord;
import com.ipl.dashboard.model.MatchRecord;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import org.springframework.stereotype.Component;

import java.io.InputStreamReader;
import java.util.Collections;
import java.util.List;

@Component
public class CsvDataParser {

    public List<MatchRecord> parseMatchCsv(InputStreamReader reader) {
        try {
            CsvToBean<MatchRecord> csvToBean = new CsvToBeanBuilder<MatchRecord>(reader)
                    .withType(MatchRecord.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();
            return csvToBean.parse();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
    public List<DeliveryRecord> parseDeliveryCsv(InputStreamReader reader) {
        try {
            CsvToBean<DeliveryRecord> csvToBean = new CsvToBeanBuilder<DeliveryRecord>(reader)
                    .withType(DeliveryRecord.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();
            return csvToBean.parse();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}
