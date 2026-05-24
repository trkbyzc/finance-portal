package com.financeportal.service.user;

import com.financeportal.model.dto.user.UserDto;
import com.financeportal.model.entity.User;
import com.financeportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsersForAdmin() {
        return userRepository.findAll().stream().map(user -> UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                // Sadece null değilse banlıdır:
                .isBanned(user.getBannedUntil() != null)
                .bannedUntil(user.getBannedUntil())
                .build()
        ).collect(Collectors.toList());
    }
}