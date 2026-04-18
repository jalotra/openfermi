package com.law.tech.backend.agentsessions.services.orchestration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionPromptRequest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OpenCodeWorkerService {

    private final HttpClient http;
    private final ObjectMapper mapper;

    @Value("${ecs.opencode-server-username:}")
    private String username;

    @Value("${ecs.opencode-server-password:}")
    private String password;

    public OpenCodeWorkerService(ObjectMapper mapper) {
        this.mapper = mapper;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    public SessionInfo createSession(String workerUrl) {
        try {
            HttpRequest request = withAuth(workerUrl, "/session", "{}", 10);
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("OpenCode create session failed with status " + response.statusCode());
            }
            Map<String, Object> data = mapper.readValue(response.body(), new TypeReference<>() {});
            String sessionId = asText(data.get("id"));
            String projectId = asText(data.get("projectID"));
            if (sessionId == null || sessionId.isBlank()) {
                throw new RuntimeException("OpenCode create session response did not include id");
            }
            return new SessionInfo(sessionId, projectId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create OpenCode session: " + e.getMessage(), e);
        }
    }

    public void prompt(String workerUrl, String sessionId, AgentSessionPromptRequest input) {
        try {
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> text = new HashMap<>();
            text.put("type", "text");
            text.put("text", input.getText());
            parts.add(text);
            for (AgentSessionPromptRequest.PromptPart item : input.getParts()) {
                if (!"file".equals(item.getType())) continue;
                if (item.getUrl() == null || item.getUrl().isBlank()) continue;
                Map<String, Object> file = new HashMap<>();
                file.put("type", "file");
                file.put("url", item.getUrl());
                if (item.getMime() != null) file.put("mime", item.getMime());
                if (item.getFilename() != null) file.put("filename", item.getFilename());
                parts.add(file);
            }

            Map<String, Object> body = Map.of("parts", parts);
            HttpRequest request =
                    withAuth(workerUrl, "/session/" + sessionId + "/message", mapper.writeValueAsString(body), 30);
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("OpenCode prompt failed with status " + response.statusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to forward prompt to OpenCode: " + e.getMessage(), e);
        }
    }

    private URI uri(String base, String path) {
        String root = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        return URI.create(root + path);
    }

    private String auth() {
        if (password == null || password.isBlank()) return "";
        String user = username == null || username.isBlank() ? "opencode" : username;
        return "Basic " + Base64.getEncoder().encodeToString((user + ":" + password).getBytes(StandardCharsets.UTF_8));
    }

    private HttpRequest withAuth(String base, String path, String body, int timeoutSeconds) {
        String auth = auth();
        HttpRequest.Builder next = HttpRequest.newBuilder()
                .uri(uri(base, path))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        if (!auth.isBlank()) {
            next.header("Authorization", auth);
        }
        return next.build();
    }

    private String asText(Object value) {
        if (value == null) return null;
        return String.valueOf(value);
    }

    public record SessionInfo(String sessionId, String projectId) {}
}
