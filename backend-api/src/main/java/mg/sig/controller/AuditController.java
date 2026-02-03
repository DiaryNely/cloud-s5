package mg.sig.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import mg.sig.dto.AuditLogDTO;
import mg.sig.mapper.AuditLogMapper;
import mg.sig.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller du journal d'audit.
 */
@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Journal d'audit des actions")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('MANAGER')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @GetMapping
    @Operation(summary = "Journal d'audit", description = "Récupère le journal d'audit")
    public ResponseEntity<List<AuditLogDTO>> getAuditLogs(
            @RequestParam(defaultValue = "100") int limit) {
        
        List<AuditLogDTO> logs = auditLogRepository.findAllOrderByDateActionDesc().stream()
                .limit(limit)
                .map(auditLogMapper::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/user/{email}")
    @Operation(summary = "Audit par utilisateur", description = "Récupère les actions d'un utilisateur")
    public ResponseEntity<List<AuditLogDTO>> getAuditByUser(@PathVariable String email) {
        List<AuditLogDTO> logs = auditLogRepository.findByUserEmailOrderByDateActionDesc(email).stream()
                .map(auditLogMapper::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/action/{action}")
    @Operation(summary = "Audit par action", description = "Récupère les logs d'une action spécifique")
    public ResponseEntity<List<AuditLogDTO>> getAuditByAction(@PathVariable String action) {
        List<AuditLogDTO> logs = auditLogRepository.findByActionOrderByDateActionDesc(action).stream()
                .map(auditLogMapper::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(logs);
    }
}
