package com.law.tech.backend.agentsessions.services.read;

import com.law.tech.backend.agentsessions.mapper.AgentArtifactMapper;
import com.law.tech.backend.agentsessions.models.AgentArtifact;
import com.law.tech.backend.agentsessions.models.dtos.AgentArtifactDto;
import com.law.tech.backend.agentsessions.repositories.AgentArtifactRepository;
import com.law.tech.backend.presign.dto.PresignUrlRequest;
import com.law.tech.backend.presign.dto.PresignUrlResponse;
import com.law.tech.backend.presign.service.PresignService;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AgentArtifactReadService {

    private final AgentArtifactRepository artifactRepository;
    private final AgentArtifactMapper artifactMapper;
    private final PresignService presignService;

    @Value("${ecs.artifact-bucket:opencode-artifacts}")
    private String artifactBucket;

    public AgentArtifactReadService(
            AgentArtifactRepository artifactRepository,
            AgentArtifactMapper artifactMapper,
            PresignService presignService) {
        this.artifactRepository = artifactRepository;
        this.artifactMapper = artifactMapper;
        this.presignService = presignService;
    }

    public List<AgentArtifactDto> findBySessionId(String productSessionId) {
        return artifactMapper.toDtoList(artifactRepository.findByProductSessionId(productSessionId));
    }

    public PresignUrlResponse getDownloadUrl(String artifactId) {
        AgentArtifact artifact = artifactRepository
                .findById(artifactId)
                .orElseThrow(() -> new RuntimeException("Artifact not found: " + artifactId));

        String storageKey = artifact.getStorageKey();
        String bucket = artifactBucket;
        String key = storageKey;

        if (storageKey.startsWith("s3://")) {
            String withoutScheme = storageKey.substring(5);
            int slashIdx = withoutScheme.indexOf('/');
            if (slashIdx > 0) {
                bucket = withoutScheme.substring(0, slashIdx);
                key = withoutScheme.substring(slashIdx + 1);
            }
        }

        PresignUrlRequest request = new PresignUrlRequest();
        request.setBucket(bucket);
        request.setKey(key);
        request.setExpiresInMinutes(15);

        return presignService.generateUrl(request);
    }
}
