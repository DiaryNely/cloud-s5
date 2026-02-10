package mg.uem.mg.clouds5p17authapi.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for JWT token generation and validation.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expirationMs:3600000}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        log.info("JwtService initialized with expiration: {}ms", expirationMs);
    }

    /**
     * Generate a JWT token for a user.
     */
    public String generateToken(String uid, String email, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", uid);
        claims.put("email", email);
        claims.put("role", role);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validate and parse a JWT token.
     * 
     * @return Claims if valid, null if invalid/expired
     */
    public Claims validateToken(String token) {
        try {
            log.debug("🔍 Validation du token JWT (longueur: {})", token.length());
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            log.debug("✅ Token valide - uid: {}, email: {}, role: {}", 
                claims.get("uid"), claims.get("email"), claims.get("role"));
            return claims;
        } catch (ExpiredJwtException e) {
            log.error("❌ JWT expiré: {}", e.getMessage());
            return null;
        } catch (JwtException e) {
            log.error("❌ JWT invalide: {} - Type: {}", e.getMessage(), e.getClass().getSimpleName());
            return null;
        } catch (Exception e) {
            log.error("❌ Erreur inattendue lors de la validation du JWT: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Extract email from token.
     */
    public String getEmailFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.getSubject() : null;
    }

    /**
     * Extract UID from token.
     */
    public String getUidFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? (String) claims.get("uid") : null;
    }

    /**
     * Check if token is valid and not expired.
     */
    public boolean isTokenValid(String token) {
        return validateToken(token) != null;
    }

    /**
     * Get token expiration time in milliseconds.
     */
    public long getExpirationMs() {
        return expirationMs;
    }
}
