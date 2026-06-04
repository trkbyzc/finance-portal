package com.financeportal.service.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;

import java.util.Locale;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * EmailService: SMTP enable/disable, blank alıcı, template render hatası,
 * MessagingException, başarılı send akışları.
 */
class EmailServiceTest {

    private JavaMailSender mailSender;
    private TemplateEngine templateEngine;
    private EmailService service;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        templateEngine = mock(TemplateEngine.class);
        service = new EmailService(templateEngine);
        ReflectionTestUtils.setField(service, "mailSender", mailSender);
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@finansportal.local");
        ReflectionTestUtils.setField(service, "fromName", "FinansPortal");
    }

    private MimeMessage stubMimeMessage() {
        Session session = Session.getInstance(new Properties());
        MimeMessage msg = new MimeMessage(session);
        when(mailSender.createMimeMessage()).thenReturn(msg);
        return msg;
    }

    @Test
    void isEnabled_true_when_enabled_and_mailSender_set() {
        assertTrue(service.isEnabled());
    }

    @Test
    void isEnabled_false_when_enabled_false() {
        ReflectionTestUtils.setField(service, "enabled", false);
        assertFalse(service.isEnabled());
    }

    @Test
    void isEnabled_false_when_mailSender_null() {
        ReflectionTestUtils.setField(service, "mailSender", null);
        assertFalse(service.isEnabled());
    }

    @Test
    void sendTemplated_disabled_returns_false_without_calling_mailSender() {
        ReflectionTestUtils.setField(service, "enabled", false);

        boolean ok = service.sendTemplated("a@b.com", "Konu", "tmpl",
                Map.of("k", "v"), Locale.of("tr"));

        assertFalse(ok);
        verifyNoInteractions(mailSender);
        verifyNoInteractions(templateEngine);
    }

    @Test
    void sendTemplated_blank_to_returns_false() {
        assertFalse(service.sendTemplated("", "Konu", "tmpl", Map.of(), Locale.of("tr")));
        assertFalse(service.sendTemplated(null, "Konu", "tmpl", Map.of(), Locale.of("tr")));
        assertFalse(service.sendTemplated("   ", "Konu", "tmpl", Map.of(), Locale.of("tr")));
        verifyNoInteractions(mailSender);
    }

    @Test
    void sendTemplated_basarili_returns_true_and_sends_mime() {
        MimeMessage msg = stubMimeMessage();
        when(templateEngine.process(eq("alarm-triggered"), any())).thenReturn("<html>x</html>");

        boolean ok = service.sendTemplated("u@x.com", "Konu", "alarm-triggered",
                Map.of("symbol", "BTC"), Locale.of("tr"));

        assertTrue(ok);
        verify(mailSender).send(msg);
        verify(templateEngine).process(eq("alarm-triggered"), any());
    }

    @Test
    void sendTemplated_null_locale_defaults_TR() {
        stubMimeMessage();
        when(templateEngine.process(any(String.class), any())).thenReturn("<html>x</html>");

        boolean ok = service.sendTemplated("u@x.com", "Konu", "t", null, null);
        assertTrue(ok);
    }

    @Test
    void sendTemplated_null_variables_does_not_crash() {
        stubMimeMessage();
        when(templateEngine.process(any(String.class), any())).thenReturn("<html>x</html>");

        boolean ok = service.sendTemplated("u@x.com", "Konu", "t", null, Locale.of("tr"));
        assertTrue(ok);
    }

    @Test
    void sendTemplated_template_render_hatasi_false_doner() {
        stubMimeMessage();
        when(templateEngine.process(any(String.class), any()))
                .thenThrow(new RuntimeException("Template parse failed"));

        boolean ok = service.sendTemplated("u@x.com", "K", "bad", Map.of(), Locale.of("tr"));
        assertFalse(ok);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendTemplated_messagingException_false_doner() {
        MimeMessage msg = stubMimeMessage();
        when(templateEngine.process(any(String.class), any())).thenReturn("<html>x</html>");
        doThrow(new org.springframework.mail.MailSendException("SMTP down"))
                .when(mailSender).send(msg);

        boolean ok = service.sendTemplated("u@x.com", "K", "t", Map.of(), Locale.of("tr"));
        // MailSendException RuntimeException — Exception catch'e düşer, false döner
        assertFalse(ok);
    }

    @Test
    void sendTemplated_subject_ve_to_alanlari_dogru_set_olur() throws MessagingException {
        MimeMessage msg = stubMimeMessage();
        when(templateEngine.process(any(String.class), any())).thenReturn("<html>x</html>");

        service.sendTemplated("alice@x.com", "Selam!", "t", Map.of(), Locale.of("tr"));

        assertEquals("Selam!", msg.getSubject());
        assertEquals("alice@x.com", msg.getAllRecipients()[0].toString());
    }
}
