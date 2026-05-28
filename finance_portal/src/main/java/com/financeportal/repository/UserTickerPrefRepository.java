package com.financeportal.repository;

import com.financeportal.model.entity.UserTickerPref;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserTickerPrefRepository extends BaseRepository<UserTickerPref, UUID> {

    List<UserTickerPref> findByUser_IdOrderByDisplayOrderAsc(UUID userId);

    /**
     * Bulk replace pattern — PUT endpoint'inde önce hepsini sil, sonra yenisini insert et.
     *
     * flushAutomatically=true KRİTİK: Hibernate default execution order'da INSERT'ler DELETE'lerden
     * önce flush edilir. Bu derived delete kullanıldığında yeni insert'ler eski satırlarla aynı
     * (user_id, symbol, asset_type) için unique constraint'e takılıyordu (409 Conflict).
     * flushAutomatically delete'i hemen DB'ye yazar, clearAutomatically persistence context'i temizler.
     */
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM UserTickerPref p WHERE p.user.id = :userId")
    void deleteByUser_Id(@Param("userId") UUID userId);
}
