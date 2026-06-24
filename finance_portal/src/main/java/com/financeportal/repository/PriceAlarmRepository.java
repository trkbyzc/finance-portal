package com.financeportal.repository;

import com.financeportal.model.entity.PriceAlarm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PriceAlarmRepository extends JpaRepository<PriceAlarm, UUID> {

    List<PriceAlarm> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    // Fiyat alarm evaluation job'u tarafından çağrılır; tetiklenmiş veya silinmiş alarmlar hariç tutulur.
    List<PriceAlarm> findByActiveTrue();
}
