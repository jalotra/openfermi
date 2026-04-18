package com.law.tech.backend.agentsessions.models.dtos;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class AgentSessionPromptRequest {

    @NotBlank
    private String text;

    private List<PromptPart> parts = List.of();

    @Data
    public static class PromptPart {
        @NotBlank
        private String type;

        private String mime;

        private String filename;

        private String url;
    }
}
