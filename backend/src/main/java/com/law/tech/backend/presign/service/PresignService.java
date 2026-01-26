package com.law.tech.backend.presign.service;

import com.law.tech.backend.presign.dto.PresignUrlRequest;
import com.law.tech.backend.presign.dto.PresignUrlResponse;

public interface PresignService {
    PresignUrlResponse generateUrl(PresignUrlRequest req);
}
