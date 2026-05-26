package com.financeportal.model.dto.user;

import com.financeportal.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private UUID id;
    private String username;
    private String email;

    /** Geçici ban aktif mi (bannedUntil > now). */
    private boolean isBanned;

    /** Kalıcı ban bayrağı. */
    private boolean banPermanent;

    /** Geçici ban bitiş zamanı (varsa). */
    private LocalDateTime bannedUntil;

    /** Lokal DB rolü (USER / ADMIN). */
    private Role role;

    /**
     * Keycloak realm-level effective rolleri. Servis hesabının 'view-users' yetkisi yoksa
     * 403 alınır ve bu liste boş döner. UI bunu "Roles unavailable" olarak gösterebilir.
     */
    private List<String> realmRoles;
}
