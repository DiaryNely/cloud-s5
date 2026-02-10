package mg.uem.mg.clouds5p17authapi;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Désactiver CSRF pour les endpoints API (pour tests locaux). En production,
                // ajuster.
                .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow auth endpoints (temporairement register pour créer le manager)
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/status").permitAll()
                    // Firebase token endpoint requires JWT authentication (handled by filter)
                    .requestMatchers("/api/auth/firebase-token").authenticated()
                    // Public read-only signalements
                    .requestMatchers(HttpMethod.GET, "/api/signalements/**").permitAll()
                    // Allow signalement creation and updates for authenticated users
                    .requestMatchers(HttpMethod.POST, "/api/signalements").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/api/signalements/**").authenticated()
                    // Allow photo uploads for authenticated users
                    .requestMatchers(HttpMethod.POST, "/api/signalements/*/photo").authenticated()
                    // Allow public access to uploaded files
                    .requestMatchers("/uploads/**").permitAll()
                        // Allow Swagger UI
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**")
                        .permitAll()
                        // Allow static resources
            .requestMatchers("/", "/index.html", "/login", "/css/**", "/js/**").permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5175"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
