package com.financeportal.repository;

import com.financeportal.model.entity.User;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends BaseRepository<User, UUID> {

    // YENİ EKLENEN METODLAR: Ban Filtresi ve giriş kontrolleri için gerekli
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);
}