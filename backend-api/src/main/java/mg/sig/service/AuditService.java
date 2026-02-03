package mg.sig.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.entity.AuditLog;
import mg.sig.entity.User;
import mg.sig.repository.AuditLogRepository;
import mg.sig.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Service de gestion des logs d'audit.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /**
     * Enregistre une action d'audit
     */
    @Transactional
    public void logAction(String action, String entite, Integer entiteId, 
                          String userEmail, String details, HttpServletRequest request) {
        try {
            User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
            
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entite(entite)
                    .entiteId(entiteId)
                    .user(user)
                    .userEmail(userEmail)
                    .details(details)
                    .ipAddress(getClientIp(request))
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .build();
            
            auditLogRepository.save(auditLog);
            log.debug("Audit log créé: {} - {} - {}", action, entite, details);
        } catch (Exception e) {
            log.error("Erreur lors de la création du log d'audit", e);
        }
    }

    /**
     * Enregistre une action d'audit avec données avant/après
     */
    @Transactional
    public void logAction(String action, String entite, Integer entiteId,
                          String userEmail, String details,
                          Map<String, Object> donneesAvant, Map<String, Object> donneesApres,
                          HttpServletRequest request) {
        try {
            User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
            
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entite(entite)
                    .entiteId(entiteId)
                    .user(user)
                    .userEmail(userEmail)
                    .details(details)
                    .donneesAvant(donneesAvant)
                    .donneesApres(donneesApres)
                    .ipAddress(getClientIp(request))
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .build();
            
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Erreur lors de la création du log d'audit", e);
        }
    }

    /**
     * Récupère l'adresse IP du client
     */
    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
