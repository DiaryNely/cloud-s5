package mg.uem.mg.clouds5p17authapi;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import mg.uem.mg.clouds5p17authapi.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        // Log uniquement pour l'endpoint firebase-token
        if (requestURI.contains("/firebase-token")) {
            log.info("🔒 JWT FILTER - Requête reçue: {} {}", method, requestURI);
        }
        
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            if (requestURI.contains("/firebase-token")) {
                log.info("🔑 JWT FILTER - Header Authorization trouvé");
            }
            
            String token = header.substring(7);
            Claims claims = jwtService.validateToken(token);

            if (claims != null) {
                String role = claims.get("role", String.class);
                String uid = claims.get("uid", String.class);
                String email = claims.get("email", String.class);
                
                if (requestURI.contains("/firebase-token")) {
                    log.info("✅ JWT FILTER - Token valide: uid={}, email={}, role={}", uid, email, role);
                }
                
                List<GrantedAuthority> authorities = new ArrayList<>();
                if (role != null && !role.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                } else {
                    authorities.add(new SimpleGrantedAuthority("ROLE_UTILISATEUR"));
                }

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), null, authorities);
                auth.setDetails(Map.of(
                        "uid", claims.get("uid"),
                        "email", claims.get("email")));
                SecurityContextHolder.getContext().setAuthentication(auth);
                
                if (requestURI.contains("/firebase-token")) {
                    log.info("✅ JWT FILTER - Authentication configurée dans SecurityContext");
                }
            } else {
                if (requestURI.contains("/firebase-token")) {
                    log.error("❌ JWT FILTER - Token invalide ou expiré");
                }
            }
        } else {
            if (requestURI.contains("/firebase-token")) {
                if (header == null) {
                    log.error("❌ JWT FILTER - Aucun header Authorization trouvé");
                } else if (!header.startsWith("Bearer ")) {
                    log.error("❌ JWT FILTER - Header Authorization ne commence pas par 'Bearer '");
                } else {
                    log.info("ℹ️ JWT FILTER - Authentication déjà présente dans SecurityContext");
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
