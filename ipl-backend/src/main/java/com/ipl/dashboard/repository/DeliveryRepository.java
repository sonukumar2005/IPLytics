package com.ipl.dashboard.repository;

import com.ipl.dashboard.model.DeliveryRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryRepository extends JpaRepository<DeliveryRecord, Long> {
}