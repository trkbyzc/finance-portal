package com.financeportal.service;

import com.financeportal.model.dto.user.UserCreateDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.entity.Account;
import com.financeportal.model.entity.User;
import com.financeportal.unitofwork.IUnitOfWork;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final IUnitOfWork unitOfWork;
    private final KafkaProducerService kafkaProducerService; // KAFKA: Bağımlılık eklendi

    public UserResponseDto createUser(UserCreateDto dto) {
        log.info("Yeni kullanıcı ve ana hesap oluşturuluyor: {}", dto.getUsername());

        // 1. Kullanıcı Nesnesini Hazırla
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setCreatedAt(LocalDateTime.now());

        // 2. Kullanıcıya Bağlı İlk Hesabı (Cüzdanı) Hazırla
        Account initialAccount = new Account();
        initialAccount.setId(UUID.randomUUID());
        initialAccount.setAccountName("Ana Hesap (Nakit Cüzdan)");
        initialAccount.setCurrency("TRY");
        // Sadece takip için boş cüzdan:
        initialAccount.setBalance(BigDecimal.ZERO);
        initialAccount.setUser(user);
        initialAccount.setCreatedAt(LocalDateTime.now());

        try {
            // 3. İşlemleri UoW üzerinden sıraya koy
            unitOfWork.getUsers().save(user);
            unitOfWork.getAccounts().save(initialAccount);

            // 4. Mühürle! (Eğer biri bile hata verirse commit çalışmaz, veri kirlenmez)
            unitOfWork.commit();

            // 5. KAFKA EVENT FIRLAT: Yeni kullanıcı geldi! (Mühürlemeden sonra fırlatılır ki sahte veri gitmesin)
            String eventMessage = "Yeni kullanıcı sisteme katıldı: " + user.getUsername() + " (Cüzdan Bakiyesi: " + initialAccount.getBalance() + " TRY)";
            kafkaProducerService.sendMessage("user-events", user.getId().toString(), eventMessage);

            log.info("Kullanıcı ve hesabı başarıyla oluşturuldu. ID: {}", user.getId());
            return convertToDto(user);

        } catch (Exception e) {
            log.error("Kullanıcı kaydı sırasında hata oluştu, işlemler geri alınıyor: ", e);
            throw new RuntimeException("Kayıt işlemi başarısız: " + e.getMessage());
        }
    }

    public List<UserResponseDto> getAllUsers() {
        return unitOfWork.getUsers().findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public UserResponseDto updateUser(UUID id, UserCreateDto dto) {
        log.info("Kullanıcı güncelleniyor. ID: {}", id);

        try {
            // 1. Kullanıcıyı bul
            User user = findUserEntityById(id);

            // 2. Yeni bilgileri set et
            user.setUsername(dto.getUsername());
            user.setEmail(dto.getEmail());
            user.setPassword(dto.getPassword());

            // 3. UoW üzerinden kaydet ve mühürle
            unitOfWork.getUsers().save(user);
            unitOfWork.commit();

            log.info("Kullanıcı başarıyla güncellendi. ID: {}", id);
            return convertToDto(user);

        } catch (Exception e) {
            log.error("Kullanıcı güncellenirken hata oluştu: {}", e.getMessage());
            throw new RuntimeException("Güncelleme başarısız: " + e.getMessage());
        }
    }

    public UserResponseDto getUserById(UUID id) {
        User user = findUserEntityById(id);
        return convertToDto(user);
    }

    public void deleteUser(UUID id) {
        User user = findUserEntityById(id);
        unitOfWork.getUsers().delete(user);
        unitOfWork.commit(); // Silme işlemini de mühürle
    }

    private User findUserEntityById(UUID id) {
        return unitOfWork.getUsers().findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
    }

    private UserResponseDto convertToDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setName(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}