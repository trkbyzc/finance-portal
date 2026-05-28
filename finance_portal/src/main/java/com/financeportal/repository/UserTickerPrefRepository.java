package com.financeportal.repository;

import com.financeportal.model.entity.UserTickerPref;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserTickerPrefRepository extends BaseRepository<UserTickerPref, UUID> {

    List<UserTickerPref> findByUser_IdOrderByDisplayOrderAsc(UUID userId);

    /** Bulk replace pattern — PUT endpoint'inde önce hepsini sil, sonra yenisini insert et. */
    void deleteByUser_Id(UUID userId);
}
