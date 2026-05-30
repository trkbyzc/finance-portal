package com.financeportal.service.user;

import com.financeportal.model.enums.RiskProfile;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RiskAnalysisServiceTest {

    private final RiskAnalysisService service = new RiskAnalysisService();

    @Test
    void totalScore3_returnsConservative() {
        Map<String, Integer> answers = Map.of("q1", 1, "q2", 1, "q3", 1);
        assertEquals(RiskProfile.CONSERVATIVE, service.calculateProfile(answers));
    }

    @Test
    void totalScore4_boundaryStillConservative() {
        Map<String, Integer> answers = Map.of("q1", 2, "q2", 2);
        assertEquals(RiskProfile.CONSERVATIVE, service.calculateProfile(answers));
    }

    @Test
    void totalScore5_returnsBalanced() {
        Map<String, Integer> answers = Map.of("q1", 2, "q2", 3);
        assertEquals(RiskProfile.BALANCED, service.calculateProfile(answers));
    }

    @Test
    void totalScore7_boundaryStillBalanced() {
        Map<String, Integer> answers = Map.of("q1", 3, "q2", 4);
        assertEquals(RiskProfile.BALANCED, service.calculateProfile(answers));
    }

    @Test
    void totalScore8_returnsAggressive() {
        Map<String, Integer> answers = Map.of("q1", 4, "q2", 4);
        assertEquals(RiskProfile.AGGRESSIVE, service.calculateProfile(answers));
    }

    @Test
    void totalScore15_returnsAggressive() {
        Map<String, Integer> answers = Map.of("q1", 5, "q2", 5, "q3", 5);
        assertEquals(RiskProfile.AGGRESSIVE, service.calculateProfile(answers));
    }

    @Test
    void emptyAnswers_returnsConservative_zeroScore() {
        assertEquals(RiskProfile.CONSERVATIVE, service.calculateProfile(Map.of()));
    }
}
