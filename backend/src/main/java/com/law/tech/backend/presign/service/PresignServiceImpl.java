package com.law.tech.backend.presign.service;

import com.law.tech.backend.presign.dto.PresignUrlRequest;
import com.law.tech.backend.presign.dto.PresignUrlResponse;
import com.law.tech.backend.presign.exception.S3PresignException;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

@Service
public class PresignServiceImpl implements PresignService {
    private final S3Presigner presigner;

    @Autowired
    public PresignServiceImpl(S3Presigner presigner) {
        this.presigner = presigner;
    }

    @Override
    public PresignUrlResponse generateUrl(PresignUrlRequest req) {
        try {
            GetObjectRequest getReq = GetObjectRequest.builder()
                    .bucket(req.getBucket())
                    .key(req.getKey())
                    .build();

            GetObjectPresignRequest presignReq = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(req.getExpiresInMinutes()))
                    .getObjectRequest(getReq)
                    .build();

            PresignedGetObjectRequest presigned = presigner.presignGetObject(presignReq);

            return new PresignUrlResponse(presigned.url().toString(), presigned.expiration());
        } catch (S3Exception e) {
            throw new S3PresignException("Unable to generate URL", e);
        }
    }
}
