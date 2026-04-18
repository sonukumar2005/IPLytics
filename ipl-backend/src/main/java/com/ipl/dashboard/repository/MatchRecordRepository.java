package com.ipl.dashboard.repository;

import com.ipl.dashboard.model.MatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRecordRepository extends JpaRepository<MatchRecord, Long> {
    
    @Query("SELECT DISTINCT m.year FROM MatchRecord m ORDER BY m.year DESC")
    List<Integer> findDistinctSeasons();

    @Query("SELECT m FROM MatchRecord m WHERE (m.team1 = :team OR m.team2 = :team) AND m.year = :year")
    List<MatchRecord> findByTeamAndYear(@Param("team") String team, @Param("year") int year);

    @Query("SELECT m FROM MatchRecord m WHERE m.year = :year")
    List<MatchRecord> findByYear(@Param("year") int year);
}
