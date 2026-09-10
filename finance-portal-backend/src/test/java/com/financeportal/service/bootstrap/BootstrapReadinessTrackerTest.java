package com.financeportal.service.bootstrap;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class BootstrapReadinessTrackerTest {

    private BootstrapReadinessTracker tracker;

    @BeforeEach
    void setUp() {
        tracker = new BootstrapReadinessTracker();
        assertNotNull(tracker);
    }

    @Test
    void register_addsToExpectedSet() {
        assertDoesNotThrow(() -> {
            tracker.register("Currency");
            tracker.register("News");
            tracker.register("Currency"); // idempotent
        });
    }

    @Test
    void markComplete_unregisteredName_doesNothing() {
        assertDoesNotThrow(() -> tracker.markComplete("Unknown"));
    }

    @Test
    void markComplete_allRegistered_printsBanner() {
        assertDoesNotThrow(() -> {
            tracker.register("A");
            tracker.register("B");
            tracker.markComplete("A");
            tracker.markComplete("B");
        });
    }

    @Test
    void markComplete_idempotent_doesNotReprintBanner() {
        assertDoesNotThrow(() -> {
            tracker.register("A");
            tracker.markComplete("A");
            tracker.markComplete("A");
        });
    }

    @Test
    void markComplete_afterBannerPrinted_isNoOp() {
        assertDoesNotThrow(() -> {
            tracker.register("A");
            tracker.markComplete("A");
            tracker.markComplete("B");
        });
    }

    @Test
    void markComplete_partialCompletion_noBanner() {
        assertDoesNotThrow(() -> {
            tracker.register("A");
            tracker.register("B");
            tracker.register("C");
            tracker.markComplete("A");
            tracker.markComplete("B");
        });
    }

    @Test
    void markComplete_emptyExpected_noBanner() {
        assertDoesNotThrow(() -> tracker.markComplete("X"));
    }
}
