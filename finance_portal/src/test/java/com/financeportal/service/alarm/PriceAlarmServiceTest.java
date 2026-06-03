package com.financeportal.service.alarm;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.alarm.CreatePriceAlarmRequest;
import com.financeportal.model.dto.alarm.PriceAlarmDto;
import com.financeportal.model.entity.PriceAlarm;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.PriceAlarmRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PriceAlarmServiceTest {

    @Mock private PriceAlarmRepository alarmRepo;
    @Mock private UserRepository userRepo;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks private PriceAlarmService service;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("alice");
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    private PriceAlarm sampleAlarm() {
        return PriceAlarm.builder()
                .id(UUID.randomUUID())
                .user(user)
                .symbol("BTC")
                .assetType(AssetType.CRYPTO)
                .condition(AlarmCondition.ABOVE)
                .threshold(new BigDecimal("60000"))
                .frequency(AlarmFrequency.ONCE)
                .active(true)
                .createdAt(LocalDateTime.now())
                .triggerCount(0)
                .build();
    }

    private CreatePriceAlarmRequest reqOf(String symbol, BigDecimal th, AlarmCondition cond) {
        CreatePriceAlarmRequest r = new CreatePriceAlarmRequest();
        r.setSymbol(symbol);
        r.setAssetType(AssetType.CRYPTO);
        r.setCondition(cond);
        r.setThreshold(th);
        r.setFrequency(AlarmFrequency.ONCE);
        return r;
    }

    @Test
    void listMyAlarms_returnsUserAlarms() {
        when(alarmRepo.findByUser_IdOrderByCreatedAtDesc(userId)).thenReturn(List.of(sampleAlarm()));
        List<PriceAlarmDto> result = service.listMyAlarms();
        assertEquals(1, result.size());
        assertEquals("BTC", result.get(0).getSymbol());
    }

    @Test
    void createAlarm_success_persistsAndReturnsDto() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(alarmRepo.save(any(PriceAlarm.class))).thenAnswer(inv -> inv.getArgument(0));

        PriceAlarmDto dto = service.createAlarm(reqOf("btc", new BigDecimal("60000"), AlarmCondition.ABOVE));

        assertEquals("BTC", dto.getSymbol()); // uppercased
        assertEquals(AlarmCondition.ABOVE, dto.getCondition());
        assertTrue(dto.isActive());
    }

    @Test
    void createAlarm_blankSymbol_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createAlarm(reqOf("  ", new BigDecimal("1"), AlarmCondition.ABOVE)));
    }

    @Test
    void createAlarm_nullThreshold_throws() {
        CreatePriceAlarmRequest req = reqOf("BTC", null, AlarmCondition.ABOVE);
        assertThrows(IllegalArgumentException.class, () -> service.createAlarm(req));
    }

    @Test
    void createAlarm_negativeThreshold_throws() {
        CreatePriceAlarmRequest req = reqOf("BTC", new BigDecimal("-1"), AlarmCondition.ABOVE);
        assertThrows(IllegalArgumentException.class, () -> service.createAlarm(req));
    }

    @Test
    void createAlarm_nullCondition_throws() {
        CreatePriceAlarmRequest req = reqOf("BTC", new BigDecimal("1"), null);
        assertThrows(IllegalArgumentException.class, () -> service.createAlarm(req));
    }

    @Test
    void createAlarm_userNotFound_throws() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.createAlarm(reqOf("BTC", new BigDecimal("60000"), AlarmCondition.ABOVE)));
    }

    @Test
    void createAlarm_frequencyDefaultsToOnce_whenNull() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(alarmRepo.save(any(PriceAlarm.class))).thenAnswer(inv -> inv.getArgument(0));
        CreatePriceAlarmRequest req = reqOf("BTC", new BigDecimal("60000"), AlarmCondition.ABOVE);
        req.setFrequency(null);

        PriceAlarmDto dto = service.createAlarm(req);

        assertEquals(AlarmFrequency.ONCE, dto.getFrequency());
    }

    @Test
    void setActive_toggleSuccess() {
        PriceAlarm a = sampleAlarm();
        when(alarmRepo.findById(a.getId())).thenReturn(Optional.of(a));
        when(alarmRepo.save(any(PriceAlarm.class))).thenAnswer(inv -> inv.getArgument(0));

        PriceAlarmDto dto = service.setActive(a.getId(), false);

        assertFalse(dto.isActive());
    }

    @Test
    void setActive_notOwned_throws404() {
        PriceAlarm a = sampleAlarm();
        User other = new User();
        other.setId(UUID.randomUUID());
        a.setUser(other);
        when(alarmRepo.findById(a.getId())).thenReturn(Optional.of(a));

        assertThrows(ResourceNotFoundException.class, () -> service.setActive(a.getId(), false));
    }

    @Test
    void deleteAlarm_owned_callsDelete() {
        PriceAlarm a = sampleAlarm();
        when(alarmRepo.findById(a.getId())).thenReturn(Optional.of(a));

        service.deleteAlarm(a.getId());

        verify(alarmRepo).delete(a);
    }

    @Test
    void deleteAlarm_notFound_throws() {
        UUID id = UUID.randomUUID();
        when(alarmRepo.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.deleteAlarm(id));
    }
}
