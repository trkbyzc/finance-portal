package com.financeportal.model.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCreateDto {
    @NotBlank(message = "Kullanıcı adı boş olamaz")
    private String username;
    @NotBlank(message = "Email boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    private String email;
    @NotBlank(message = "Şifre boş olamaz")
    @Size(min = 6, message = "Şifre en az 6 karakter olmalıdır")
    private String password;
}