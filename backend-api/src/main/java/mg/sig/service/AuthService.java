package mg.sig.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.dto.auth.LoginRequest;
import mg.sig.dto.auth.LoginResponse;
import mg.sig.entity.*;
import mg.sig.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service d'authentification.
 * Gère l'authentification locale (PostgreSQL) et Firebase.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final TentativeConnexionRepository tentativeRepository;
    private final UserStatusRepository userStatusRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ParametreService parametreService;
    private final AuditService auditService;

    /**
     * Authentification d'un utilisateur
     */
    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase().trim();
        
        // Vérifier si l'utilisateur existe
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        
        // Vérifier les tentatives échouées récentes
        if (isAccountLocked(email)) {
            logFailedAttempt(email, null, httpRequest, "Compte temporairement bloqué");
            return LoginResponse.failure("Compte temporairement bloqué. Réessayez plus tard.");
        }
        
        if (user == null) {
            logFailedAttempt(email, null, httpRequest, "Utilisateur non trouvé");
            return LoginResponse.failure("Email ou mot de passe incorrect");
        }
        
        // Vérifier si le compte est bloqué
        if (user.getBloque()) {
            logFailedAttempt(email, user, httpRequest, "Compte bloqué");
            return LoginResponse.failure("Votre compte est bloqué. Contactez l'administrateur.");
        }
        
        // Vérifier si le compte est actif
        if (!user.getActif()) {
            logFailedAttempt(email, user, httpRequest, "Compte inactif");
            return LoginResponse.failure("Votre compte est désactivé.");
        }
        
        // Vérifier le mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(email, user, httpRequest);
            return LoginResponse.failure("Email ou mot de passe incorrect");
        }
        
        // Authentification réussie
        return handleSuccessfulLogin(user, httpRequest);
    }

    /**
     * Vérifie si le compte est temporairement bloqué
     */
    private boolean isAccountLocked(String email) {
        int maxAttempts = parametreService.getMaxTentativesConnexion();
        int lockoutMinutes = parametreService.getDureeBlocageMinutes();
        
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutMinutes);
        Long failedAttempts = tentativeRepository.countFailedAttemptsSince(email, since);
        
        return failedAttempts >= maxAttempts;
    }

    /**
     * Gère une tentative de connexion échouée
     */
    private void handleFailedLogin(String email, User user, HttpServletRequest request) {
        logFailedAttempt(email, user, request, "Mot de passe incorrect");
        
        int maxAttempts = parametreService.getMaxTentativesConnexion();
        int lockoutMinutes = parametreService.getDureeBlocageMinutes();
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutMinutes);
        Long failedAttempts = tentativeRepository.countFailedAttemptsSince(email, since);
        
        // Bloquer le compte si trop de tentatives
        if (failedAttempts + 1 >= maxAttempts && user != null) {
            blockUser(user, "Trop de tentatives de connexion échouées");
            auditService.logAction(
                AuditLog.ACTION_BLOCAGE_COMPTE, "USER", user.getId(),
                email, "Compte bloqué après " + maxAttempts + " tentatives échouées", request
            );
        }
    }

    /**
     * Gère une connexion réussie
     */
    private LoginResponse handleSuccessfulLogin(User user, HttpServletRequest request) {
        // Générer les tokens
        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        // Créer la session
        int sessionDurationHours = parametreService.getDureeSessionHeures();
        Session session = Session.builder()
                .user(user)
                .token(token)
                .refreshToken(refreshToken)
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .dateExpiration(LocalDateTime.now().plusHours(sessionDurationHours))
                .dateDerniereActivite(LocalDateTime.now())
                .build();
        sessionRepository.save(session);
        
        // Mettre à jour la dernière connexion
        user.setDerniereConnexion(LocalDateTime.now());
        userRepository.save(user);
        
        // Log de succès
        logSuccessfulAttempt(user.getEmail(), user, request);
        auditService.logAction(
            AuditLog.ACTION_CONNEXION, "SESSION", session.getId(),
            user.getEmail(), "Connexion réussie depuis l'application", request
        );
        
        log.info("Connexion réussie pour: {}", user.getEmail());
        
        return LoginResponse.success(
            user.getEmail(),
            user.getNom(),
            user.getPrenom(),
            user.getRole().getCode().toLowerCase(),
            token,
            refreshToken
        );
    }

    /**
     * Rafraîchit le token JWT
     */
    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtService.validateToken(refreshToken)) {
            return LoginResponse.failure("Token invalide ou expiré");
        }
        
        Session session = sessionRepository.findByRefreshToken(refreshToken).orElse(null);
        if (session == null || !session.getActif()) {
            return LoginResponse.failure("Session invalide");
        }
        
        User user = session.getUser();
        String newToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);
        
        // Mettre à jour la session
        session.setToken(newToken);
        session.setRefreshToken(newRefreshToken);
        session.setDateDerniereActivite(LocalDateTime.now());
        session.setDateExpiration(LocalDateTime.now().plusHours(parametreService.getDureeSessionHeures()));
        sessionRepository.save(session);
        
        return LoginResponse.success(
            user.getEmail(),
            user.getNom(),
            user.getPrenom(),
            user.getRole().getCode().toLowerCase(),
            newToken,
            newRefreshToken
        );
    }

    /**
     * Déconnexion
     */
    @Transactional
    public void logout(String token, HttpServletRequest request) {
        sessionRepository.findByToken(token).ifPresent(session -> {
            session.setActif(false);
            sessionRepository.save(session);
            
            auditService.logAction(
                AuditLog.ACTION_DECONNEXION, "SESSION", session.getId(),
                session.getUser().getEmail(), "Déconnexion", request
            );
        });
    }

    /**
     * Bloque un utilisateur
     */
    @Transactional
    public void blockUser(User user, String raison) {
        user.setBloque(true);
        user.setDateBlocage(LocalDateTime.now());
        user.setRaisonBlocage(raison);
        
        UserStatus blockedStatus = userStatusRepository.findByCode(UserStatus.BLOQUE).orElse(null);
        if (blockedStatus != null) {
            user.setStatus(blockedStatus);
        }
        
        userRepository.save(user);
        
        // Invalider toutes les sessions
        sessionRepository.deactivateAllByUserId(user.getId());
    }

    /**
     * Débloque un utilisateur
     */
    @Transactional
    public void unblockUser(Integer userId, String adminEmail, HttpServletRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        user.setBloque(false);
        user.setDateBlocage(null);
        user.setRaisonBlocage(null);
        
        UserStatus activeStatus = userStatusRepository.findByCode(UserStatus.ACTIF).orElse(null);
        if (activeStatus != null) {
            user.setStatus(activeStatus);
        }
        
        userRepository.save(user);
        
        auditService.logAction(
            AuditLog.ACTION_DEBLOCAGE_COMPTE, "USER", userId,
            adminEmail, "Déblocage du compte " + user.getEmail(), request
        );
    }

    private void logFailedAttempt(String email, User user, HttpServletRequest request, String motif) {
        TentativeConnexion tentative = TentativeConnexion.builder()
                .email(email)
                .user(user)
                .ipAddress(getClientIp(request))
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .reussi(false)
                .motifEchec(motif)
                .build();
        tentativeRepository.save(tentative);
    }

    private void logSuccessfulAttempt(String email, User user, HttpServletRequest request) {
        TentativeConnexion tentative = TentativeConnexion.builder()
                .email(email)
                .user(user)
                .ipAddress(getClientIp(request))
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .reussi(true)
                .build();
        tentativeRepository.save(tentative);
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
