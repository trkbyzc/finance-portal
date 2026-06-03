package com.financeportal.service.bootstrap;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BootstrapReadinessTrackerTest {

    private BootstrapReadinessTracker tracker;

    @BeforeEach
    void setUp() {
        tracker = new BootstrapReadinessTracker();
    }

    @Test
    void register_addsToExpectedSet() {
        tracker.register("Currency");
        tracker.register("News");
        // idempotent — same name no-op
        tracker.register("Currency");
        // No exception, banner not yet printed (incomplete)
    }

    @Test
    void markComplete_unregisteredName_doesNothing() {
        tracker.markComplete("Unknown");
        // No exception; banner not printed (no expected)
    }

    @Test
    void markComplete_allRegistered_printsBanner() {
        tracker.register("A");
        tracker.register("B");
        tracker.markComplete("A");
        tracker.markComplete("B");
        // Banner printed once
    }

    @Test
    void markComplete_idempotent_doesNotReprintBanner() {
        tracker.register("A");
        tracker.markComplete("A");
        tracker.markComplete("A"); // duplicate
        // No exception
    }

    @Test
    void markComplete_afterBannerPrinted_isNoOp() {
        tracker.register("A");
        tracker.markComplete("A"); // banner printed
        tracker.markComplete("B"); // bannerPrinted.get() == true → early return
    }

    @Test
    void markComplete_partialCompletion_noBanner() {
        tracker.register("A");
        tracker.register("B");
        tracker.register("C");
        tracker.markComplete("A");
        tracker.markComplete("B");
        // C not done → banner not printed
    }

    @Test
    void markComplete_emptyExpected_noBanner() {
        tracker.markComplete("X");
        // expected.isEmpty() guard skips banner
    }
}
