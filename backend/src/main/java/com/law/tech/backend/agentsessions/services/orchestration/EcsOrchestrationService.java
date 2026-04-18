package com.law.tech.backend.agentsessions.services.orchestration;

import com.law.tech.backend.agentsessions.models.AgentSession;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ecs.EcsClient;
import software.amazon.awssdk.services.ecs.model.*;

@Service
public class EcsOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(EcsOrchestrationService.class);

    private final EcsClient ecs;
    private final HttpClient http;

    @Value("${ecs.cluster}")
    private String cluster;

    @Value("${ecs.task-definition}")
    private String taskDefinition;

    @Value("${ecs.subnets}")
    private String subnets;

    @Value("${ecs.security-groups}")
    private String securityGroups;

    @Value("${ecs.container-name}")
    private String containerName;

    @Value("${ecs.container-port}")
    private int containerPort;

    @Value("${ecs.worker-url-template:}")
    private String workerUrlTemplate;

    public EcsOrchestrationService(EcsClient ecs) {
        this.ecs = ecs;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    public String provision(AgentSession session) {
        List<KeyValuePair> env = List.of(
                KeyValuePair.builder().name("S3_BUNDLE_PREFIX").value("s3://opencode-bundles/stem/").build(),
                KeyValuePair.builder().name("OPENCODE_PORT").value(String.valueOf(containerPort)).build());

        ContainerOverride override = ContainerOverride.builder()
                .name(containerName)
                .environment(env)
                .build();

        TaskOverride taskOverride = TaskOverride.builder().containerOverrides(override).build();

        AwsVpcConfiguration vpc = AwsVpcConfiguration.builder()
                .subnets(parseList(subnets))
                .securityGroups(parseList(securityGroups))
                .assignPublicIp(AssignPublicIp.DISABLED)
                .build();

        NetworkConfiguration network =
                NetworkConfiguration.builder().awsvpcConfiguration(vpc).build();

        RunTaskRequest request = RunTaskRequest.builder()
                .cluster(cluster)
                .taskDefinition(taskDefinition)
                .launchType(LaunchType.FARGATE)
                .networkConfiguration(network)
                .overrides(taskOverride)
                .count(1)
                .tags(Tag.builder().key("session-id").value(session.getId().toString()).build())
                .build();

        RunTaskResponse response = ecs.runTask(request);

        if (response.failures() != null && !response.failures().isEmpty()) {
            Failure failure = response.failures().get(0);
            throw new RuntimeException("ECS RunTask failed: " + failure.reason());
        }

        return response.tasks().get(0).taskArn();
    }

    public String resolveWorkerUrl(String taskArn) {
        if (workerUrlTemplate != null && !workerUrlTemplate.isBlank()) {
            String token = taskArn.contains("/") ? taskArn.substring(taskArn.lastIndexOf('/') + 1) : taskArn;
            return workerUrlTemplate
                    .replace("{taskArn}", taskArn)
                    .replace("{taskId}", token)
                    .replace("{port}", String.valueOf(containerPort));
        }
        DescribeTasksResponse response = ecs.describeTasks(
                DescribeTasksRequest.builder().cluster(cluster).tasks(taskArn).build());

        if (response.tasks().isEmpty()) throw new RuntimeException("Task not found: " + taskArn);

        Task task = response.tasks().get(0);

        for (Attachment attachment : task.attachments()) {
            if (!"ElasticNetworkInterface".equals(attachment.type())) continue;
            for (KeyValuePair detail : attachment.details()) {
                if ("privateIPv4Address".equals(detail.name())) {
                    return "http://" + detail.value() + ":" + containerPort;
                }
            }
        }

        throw new RuntimeException("No private IP found for task: " + taskArn);
    }

    public String awaitWorkerUrl(String taskArn) {
        RuntimeException last = null;
        for (int i = 0; i < 30; i++) {
            try {
                String url = resolveWorkerUrl(taskArn);
                if (url != null && !url.isBlank()) return url;
            } catch (RuntimeException e) {
                last = e;
            }
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted while waiting for worker URL", e);
            }
        }
        if (last != null) throw last;
        throw new RuntimeException("Worker URL not available for task: " + taskArn);
    }

    public Map<String, String> describeTask(String taskArn) {
        DescribeTasksResponse response = ecs.describeTasks(
                DescribeTasksRequest.builder().cluster(cluster).tasks(taskArn).build());

        if (response.tasks().isEmpty()) return Map.of("status", "NOT_FOUND");

        Task task = response.tasks().get(0);
        return Map.of(
                "status", task.lastStatus(),
                "desired", task.desiredStatus(),
                "health", task.healthStatusAsString() != null ? task.healthStatusAsString() : "UNKNOWN");
    }

    public void stop(String taskArn) {
        ecs.stopTask(StopTaskRequest.builder()
                .cluster(cluster)
                .task(taskArn)
                .reason("Terminated by control plane")
                .build());
    }

    public boolean healthCheck(String workerUrl) {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder().uri(URI.create(workerUrl)).GET().timeout(Duration.ofSeconds(3)).build();
            HttpResponse<Void> response = http.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() >= 200 && response.statusCode() < 400;
        } catch (Exception e) {
            log.debug("Health check failed for {}: {}", workerUrl, e.getMessage());
            return false;
        }
    }

    private List<String> parseList(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return List.of(csv.split(","));
    }
}
