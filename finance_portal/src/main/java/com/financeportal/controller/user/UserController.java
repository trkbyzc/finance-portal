package com.financeportal.controller;

import com.financeportal.model.dto.user.UserCreateDto;
import com.financeportal.model.dto.user.UserRegistrationDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.RiskProfile;
import com.financeportal.repository.UserRepository;
import com.financeportal.service.RiskAnalysisService;
import com.financeportal.service.user.UserService;
import com.financeportal.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    // Mevcut servis
    private final UserService userService;

    // KYC için yeni eklenen bağımlılıklar
    private final RiskAnalysisService riskAnalysisService;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(@RequestBody UserCreateDto dto) {
        return ResponseEntity.ok(userService.createUser(dto));
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable UUID id, @RequestBody UserCreateDto dto) {
        return ResponseEntity.ok(userService.updateUser(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // --- YENİ EKLENEN KYC (RİSK PROFİLLEME) ENDPOINT'İ ---

    @PostMapping("/kyc")
    public ResponseEntity<?> submitKyc(@RequestBody UserRegistrationDto registrationDto) {
        // SecurityUtils kullanarak token'ı olan mevcut kullanıcının ID'sini alıyoruz
        UUID userId = securityUtils.getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı. Lütfen tekrar giriş yapın."));

        // Servise anket cevaplarını gönderip profili hesaplatıyoruz
        RiskProfile calculatedProfile = riskAnalysisService.calculateProfile(registrationDto.getSurveyAnswers());

        // Kullanıcının profilini güncelleyip kaydediyoruz
        user.setRiskProfile(calculatedProfile);
        userRepository.save(user);

        return ResponseEntity.ok("Anket başarıyla tamamlandı. Yatırımcı Profiliniz: " + calculatedProfile.name());
    }
}