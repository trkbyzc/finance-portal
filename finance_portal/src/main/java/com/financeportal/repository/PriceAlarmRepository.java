package com.financeportal.repository;

import com.financeportal.model.entity.PriceAlarm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PriceAlarmRepository extends JpaRepository<PriceAlarm, UUID> {

    /** Kullanıcının tüm alarmları (yeni → eski). */
    List<PriceAlarm> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    /** Evaluation job için: aktif alarmları (deleted=false). */
    List<PriceAlarm> findByActiveTrue();
}
