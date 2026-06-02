package com.financeportal.service.user;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.user.UserRegistrationDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.RiskProfile;
import com.financeportal.model.enums.Role;
import com.financeportal.repository.UserRepository;
import com.financeportal.service.mapper.user.UserMapper;
import com.financeportal.service.messaging.KafkaProducerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final KafkaProducerService kafkaProducerService;
    private final RiskAnalysisService riskAnalysisService;
    private final UserMapper userMapper;

    @Transactional
    public UserResponseDto syncAndCreateUser(UUID userId, String username, String email) {
        log.info("Keycloak senkronizasyonu ile yeni kullanıcı kaydı başlatıldı: {}", username);

        User user = User.createNewUser(userId, username, email);
        userRepository.save(user);

        kafkaProducerService.sendMessage("user-events", user.getId().toString(), "NEW_USER_CREATED");

        log.info("Kullanıcı başarıyla oluşturuldu. ID: {}", user.getId());
        return userMapper.toDto(user);
    }

    /**
     * Keycloak realm rollerine göre DB role alanını günceller. Sadece gerçekten
     * değişen kullanıcılar için DB'ye yazar (idempotent).
     *
     * @param userId         JWT 'sub' UUID
     * @param isKeycloakAdmin JWT realm_access.roles içinde "ADMIN" var mı
     */
    @Transactional
    public void syncRoleFromKeycloak(UUID userId, boolean isKeycloakAdmin) {
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return;
        User user = opt.get();
        Role desired = isKeycloakAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() == desired) return;
        log.info("[USER-SYNC] {} kullanıcısının rolü {} → {} olarak senkronize edildi (Keycloak source-of-truth).",
                user.getUsername(), user.getRole(), desired);
        user.setRole(desired);
        userRepository.save(user);
    }

    @Transactional
    public String processKyc(UUID userId, UserRegistrationDto registrationDto) {
        log.info("KYC süreci işleniyor. Kullanıcı ID: {}", userId);

        User user = findUserEntityById(userId);
        RiskProfile profile = riskAnalysisService.calculateProfile(registrationDto.getSurveyAnswers());
        user.applyKycProfile(profile);
        userRepository.save(user);

        log.info("Kullanıcı risk profili güncellendi: {}", profile);
        return profile.name();
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }

    public UserResponseDto getUserById(UUID id) {
        return userMapper.toDto(findUserEntityById(id));
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = findUserEntityById(id);
        userRepository.delete(user);
    }

    private User findUserEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));
    }
}
