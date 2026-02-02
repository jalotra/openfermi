package com.law.tech.backend.config.filters;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.base.models.GenericResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-KEY";

    private static final List<String> EXCLUDED_PATHS = List.of(
            "/health",
            "/health/**",
            "/actuator",
            "/actuator/**",
            "/api/v3/api-docs",
            "/api/v3/api-docs/**",
            "/api/swagger-ui/**",
            "/api/swagger-ui.html"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final ObjectMapper objectMapper;

    @Value("${app.api.key.enabled:false}")
    private boolean apiKeyEnabled;

    @Value("${app.api.key.value:}")
    private String apiKeyValue;

    public ApiKeyAuthFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!apiKeyEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestPath = request.getRequestURI();
        if (isExcludedPath(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        String providedApiKey = request.getHeader(API_KEY_HEADER);

        if (providedApiKey == null || providedApiKey.isBlank()) {
            log.warn("API key missing for request: {} {}", request.getMethod(), requestPath);
            sendUnauthorizedResponse(response, "API key is required");
            return;
        }

        if (!apiKeyValue.equals(providedApiKey)) {
            log.warn("Invalid API key for request: {} {}", request.getMethod(), requestPath);
            sendUnauthorizedResponse(response, "Invalid API key");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isExcludedPath(String requestPath) {
        return EXCLUDED_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        GenericResponse<String> errorResponse = GenericResponse.<String>builder()
                .data(null)
                .message(message)
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
