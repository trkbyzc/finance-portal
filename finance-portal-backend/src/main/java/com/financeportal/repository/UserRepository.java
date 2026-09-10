package com.financeportal.repository;

import com.financeportal.model.entity.User;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends BaseRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    /**
     * Süresi dolmuş ancak hâlâ bannedUntil set'li olan kullanıcıları getirir.
     * BanExpiryJob bunları toplu temizlemek için kullanır. Kalıcı ban'lar dahil değil.
     */
    List<User> findByBannedUntilBeforeAndBanPermanentFalse(LocalDateTime now);
}
