package com.financeportal.service.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.UnsupportedEncodingException;
import java.util.Locale;
import java.util.Map;

/**
 * E-posta gönderimi — Thymeleaf template + JavaMailSender üzerinden.
 * SMTP kapalıysa (app.mail.enabled=false veya credential yok) sessizce skip eder,
 * log'a yazıp false döner. Caller "gönderemedik ama akış kırılmasın" davranışını gösterir.
 *
 * JavaMailSender constructor injection ile geliyor (Sonar S6813). spring-boot-starter-mail
 * classpath'te değilse Spring otomatik ObjectProvider'a null değer atar → isEnabled() false.
 */
@Service
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;
    private final JavaMailSender mailSender; // optional — null olabilir

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:noreply@finansportal.local}")
    private String fromAddress;

    @Value("${app.mail.from-name:FinansPortal}")
    private String fromName;

    public EmailService(TemplateEngine templateEngine, ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.templateEngine = templateEngine;
        // ObjectProvider.getIfAvailable() → bean yoksa null (eski @Autowired required=false ile aynı)
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public boolean isEnabled() {
        return enabled && mailSender != null;
    }

    /**
     * Thymeleaf template'i render edip HTML e-posta gönderir.
     * @return true → gönderildi, false → atlandı / başarısız
     */
    public boolean sendTemplated(String to, String subject, String templateName, Map<String, Object> variables, Locale locale) {
        if (!isEnabled()) {
            log.debug("[MAIL] Disabled — skipping send to {}", to);
            return false;
        }
        if (to == null || to.isBlank()) {
            log.warn("[MAIL] Boş alıcı, atlandı.");
            return false;
        }
        try {
            Context ctx = new Context(locale != null ? locale : Locale.of("tr"));
            if (variables != null) ctx.setVariables(variables);
            String html = templateEngine.process(templateName, ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            try {
                helper.setFrom(new InternetAddress(fromAddress, fromName, "UTF-8"));
            } catch (UnsupportedEncodingException ue) {
                log.warn("[MAIL] from-name encoding hatası, salt adres kullanılıyor: {}", ue.getMessage());
                helper.setFrom(fromAddress);
            }
            helper.setText(html, true);

            mailSender.send(message);
            log.info("[MAIL] Gönderildi → {} | konu='{}'", to, subject);
            return true;
        } catch (MessagingException e) {
            log.warn("[MAIL] Gönderim hatası ({}): {}", to, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("[MAIL] Beklenmedik mail hatası ({}): {}", to, e.getMessage(), e);
            return false;
        }
    }
}
