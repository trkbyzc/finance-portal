package com.financeportal.repository;

import com.financeportal.model.entity.Simulation;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SimulationRepository extends BaseRepository<Simulation, UUID> {

    List<Simulation> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    Optional<Simulation> findByIdAndUser_Id(UUID id, UUID userId);
}
