package com.ipl.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VenueDto {
    private String venueName;
    private double lat;
    private double lon;
    private long matchesPlayed;

    // Alias for any callers using old field name
    @JsonProperty("stadiumName")
    public String getStadiumName() { return venueName; }

    @JsonProperty("latitude")
    public double getLatitude() { return lat; }

    @JsonProperty("longitude")
    public double getLongitude() { return lon; }
}
