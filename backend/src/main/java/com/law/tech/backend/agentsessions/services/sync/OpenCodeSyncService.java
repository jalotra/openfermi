package com.law.tech.backend.agentsessions.services.sync;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.agentsessions.models.AgentArtifact;
import com.law.tech.backend.agentsessions.models.AgentMessage;
import com.law.tech.backend.agentsessions.models.AgentPart;
import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.repositories.AgentArtifactRepository;
import com.law.tech.backend.agentsessions.repositories.AgentMessageRepository;
import com.law.tech.backend.agentsessions.repositories.AgentPartRepository;
import com.law.tech.backend.agentsessions.repositories.AgentSessionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OpenCodeSyncService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final AgentSessionRepository sessions;
    private final AgentMessageRepository messages;
    private final AgentPartRepository parts;
    private final AgentArtifactRepository artifacts;

    public OpenCodeSyncService(
            JdbcTemplate jdbc,
            ObjectMapper mapper,
            AgentSessionRepository sessions,
            AgentMessageRepository messages,
            AgentPartRepository parts,
            AgentArtifactRepository artifacts) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.sessions = sessions;
        this.messages = messages;
        this.parts = parts;
        this.artifacts = artifacts;
    }

    @Transactional
    public void sync(UUID productSessionId) {
        Optional<AgentSession> match = sessions.findById(productSessionId);
        if (match.isEmpty()) return;
        AgentSession session = match.get();
        if (session.getOpencodeSessionId() == null || session.getOpencodeSessionId().isBlank()) return;
        String source = session.getOpencodeSessionId();

        List<RawMessage> rawMessages = jdbc.query(
                "select id, session_id, time_created, data::text as data from public.message where session_id = ? order by time_created asc, id asc",
                (rs, rowNum) -> new RawMessage(
                        rs.getString("id"),
                        rs.getString("session_id"),
                        rs.getLong("time_created"),
                        rs.getString("data")),
                source);

        for (RawMessage raw : rawMessages) {
            AgentMessage next = mapMessage(raw, productSessionId.toString());
            messages.save(next);
        }

        List<RawPart> rawParts = jdbc.query(
                "select id, message_id, session_id, time_created, data::text as data from public.part where session_id = ? order by time_created asc, id asc",
                (rs, rowNum) -> new RawPart(
                        rs.getString("id"),
                        rs.getString("message_id"),
                        rs.getString("session_id"),
                        rs.getLong("time_created"),
                        rs.getString("data")),
                source);

        for (RawPart raw : rawParts) {
            AgentPart next = mapPart(raw, productSessionId.toString());
            parts.save(next);
            for (AgentArtifact item : extractArtifacts(next, raw.createdAtMillis)) {
                artifacts.save(item);
            }
        }

        long in = 0;
        long out = 0;
        long reason = 0;
        double cost = 0.0;
        List<AgentMessage> local = messages.findByProductSessionIdOrderByCreatedAtAsc(productSessionId.toString());
        for (AgentMessage item : local) {
            in += item.getTokensInput() == null ? 0 : item.getTokensInput();
            out += item.getTokensOutput() == null ? 0 : item.getTokensOutput();
            reason += item.getTokensReasoning() == null ? 0 : item.getTokensReasoning();
            cost += item.getCost() == null ? 0.0 : item.getCost();
        }
        session.setTokenUsage(in + out + reason);
        session.setCost(cost);
        sessions.save(session);
    }

    private AgentMessage mapMessage(RawMessage raw, String productSessionId) {
        JsonNode data = parse(raw.data);
        AgentMessage item = new AgentMessage();
        item.setId(raw.id);
        item.setProductSessionId(productSessionId);
        item.setOpencodeSessionId(raw.sessionId);
        item.setRole(text(data, "role", "assistant"));
        item.setAgent(text(data, "agent", null));
        item.setModelId(text(data, "modelID", null));
        item.setProviderId(text(data, "providerID", null));
        item.setCost(number(data, "cost"));
        item.setTokensInput(intNode(data.at("/tokens/input")));
        item.setTokensOutput(intNode(data.at("/tokens/output")));
        item.setTokensReasoning(intNode(data.at("/tokens/reasoning")));
        JsonNode err = data.get("error");
        item.setError(err == null || err.isNull() ? null : err.toString());
        item.setCreatedAt(Instant.ofEpochMilli(raw.createdAtMillis));
        JsonNode done = data.at("/time/completed");
        item.setCompletedAt(done.isMissingNode() || done.isNull() ? null : Instant.ofEpochMilli(done.asLong()));
        item.setSyncedAt(Instant.now());
        return item;
    }

    private AgentPart mapPart(RawPart raw, String productSessionId) {
        JsonNode data = parse(raw.data);
        String kind = text(data, "type", "unknown");
        AgentPart item = new AgentPart();
        item.setId(raw.id);
        item.setMessageId(raw.messageId);
        item.setProductSessionId(productSessionId);
        item.setOpencodeSessionId(raw.sessionId);
        item.setType("tool".equals(kind) ? "tool-invocation" : kind);
        item.setToolName(text(data, "tool", null));
        item.setToolCallId(text(data, "callID", null));
        item.setToolStatus(text(data.at("/state"), "status", null));
        item.setData(normalizePartData(data, kind));
        item.setSyncedAt(Instant.now());
        return item;
    }

    private List<AgentArtifact> extractArtifacts(AgentPart part, long createdAtMillis) {
        List<AgentArtifact> out = new ArrayList<>();
        JsonNode data = parse(part.getData());
        if (data.isMissingNode() || data.isNull()) return out;
        JsonNode files = data.path("attachments");
        if (files.isArray()) {
            int i = 0;
            for (JsonNode node : files) {
                String url = text(node, "url", null);
                if (url == null || !url.startsWith("s3://")) continue;
                String mime = text(node, "mime", "application/octet-stream");
                AgentArtifact item = new AgentArtifact();
                item.setId(part.getId() + ":" + i);
                item.setProductSessionId(part.getProductSessionId());
                item.setMessageId(part.getMessageId());
                item.setPartId(part.getId());
                item.setStorageKey(url);
                item.setMime(mime);
                item.setBytes(node.path("bytes").isNumber() ? node.path("bytes").asInt() : null);
                item.setSha256(text(node, "sha256", null));
                item.setCreatedAt(Instant.ofEpochMilli(createdAtMillis));
                out.add(item);
                i++;
            }
        }
        String url = text(data, "url", null);
        if (url != null && url.startsWith("s3://")) {
            AgentArtifact item = new AgentArtifact();
            item.setId(part.getId());
            item.setProductSessionId(part.getProductSessionId());
            item.setMessageId(part.getMessageId());
            item.setPartId(part.getId());
            item.setStorageKey(url);
            item.setMime(text(data, "mime", "application/octet-stream"));
            item.setBytes(data.path("bytes").isNumber() ? data.path("bytes").asInt() : null);
            item.setSha256(text(data, "sha256", null));
            item.setCreatedAt(Instant.ofEpochMilli(createdAtMillis));
            out.add(item);
        }
        return out;
    }

    private String normalizePartData(JsonNode data, String kind) {
        try {
            if ("text".equals(kind)) {
                return mapper.writeValueAsString(mapper.createObjectNode().put("text", text(data, "text", "")));
            }
            if ("tool".equals(kind)) {
                JsonNode state = data.path("state");
                var json = mapper.createObjectNode();
                json.set("input", state.path("input"));
                json.set("output", state.path("output"));
                json.set("error", state.path("error"));
                json.set("attachments", state.path("attachments"));
                return mapper.writeValueAsString(json);
            }
            return data.toString();
        } catch (Exception e) {
            return data.toString();
        }
    }

    private JsonNode parse(String raw) {
        try {
            return mapper.readTree(raw);
        } catch (Exception e) {
            return mapper.createObjectNode();
        }
    }

    private String text(JsonNode node, String key, String fallback) {
        if (node == null || node.isNull() || node.isMissingNode()) return fallback;
        JsonNode value = node.get(key);
        if (value == null || value.isNull() || value.isMissingNode()) return fallback;
        return value.asText();
    }

    private Double number(JsonNode node, String key) {
        if (node == null || node.isNull()) return 0.0;
        JsonNode value = node.get(key);
        if (value == null || value.isNull()) return 0.0;
        return value.isNumber() ? value.asDouble() : 0.0;
    }

    private Integer intNode(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) return 0;
        return node.isNumber() ? node.asInt() : 0;
    }

    private record RawMessage(String id, String sessionId, long createdAtMillis, String data) {}

    private record RawPart(String id, String messageId, String sessionId, long createdAtMillis, String data) {}
}
