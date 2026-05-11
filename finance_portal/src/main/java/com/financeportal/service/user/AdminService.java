package com.financeportal.service;

import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    @Transactional
    public void banUser(UUID userId, int days) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        user.setBannedUntil(LocalDateTime.now().plusDays(days));
        userRepository.save(user);
    }

    @Transactional
    public void unbanUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        user.setBannedUntil(null);
        userRepository.save(user);
    }
}