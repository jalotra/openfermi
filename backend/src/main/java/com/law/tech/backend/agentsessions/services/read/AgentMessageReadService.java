package com.law.tech.backend.agentsessions.services.read;

import com.law.tech.backend.agentsessions.mapper.AgentMessageMapper;
import com.law.tech.backend.agentsessions.mapper.AgentPartMapper;
import com.law.tech.backend.agentsessions.models.AgentMessage;
import com.law.tech.backend.agentsessions.models.AgentPart;
import com.law.tech.backend.agentsessions.models.dtos.AgentMessageDto;
import com.law.tech.backend.agentsessions.models.dtos.AgentPartDto;
import com.law.tech.backend.agentsessions.repositories.AgentMessageRepository;
import com.law.tech.backend.agentsessions.repositories.AgentPartRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentMessageReadService {

    private final AgentMessageRepository messageRepository;
    private final AgentPartRepository partRepository;
    private final AgentMessageMapper messageMapper;
    private final AgentPartMapper partMapper;

    public AgentMessageReadService(
            AgentMessageRepository messageRepository,
            AgentPartRepository partRepository,
            AgentMessageMapper messageMapper,
            AgentPartMapper partMapper) {
        this.messageRepository = messageRepository;
        this.partRepository = partRepository;
        this.messageMapper = messageMapper;
        this.partMapper = partMapper;
    }

    @Transactional(readOnly = true)
    public List<AgentMessageDto> findBySessionIdWithParts(String productSessionId) {
        List<AgentMessage> messages =
                messageRepository.findByProductSessionIdOrderByCreatedAtAsc(productSessionId);
        List<AgentPart> allParts = partRepository.findByProductSessionId(productSessionId);

        Map<String, List<AgentPartDto>> partsByMessageId = allParts.stream()
                .collect(Collectors.groupingBy(
                        AgentPart::getMessageId, Collectors.mapping(partMapper::toDto, Collectors.toList())));

        return messages.stream()
                .map(msg -> {
                    AgentMessageDto dto = messageMapper.toDto(msg);
                    dto.setParts(partsByMessageId.getOrDefault(msg.getId(), List.of()));
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
