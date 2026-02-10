package mg.uem.mg.clouds5p17authapi;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@Component
public class FirebaseAuthenticationProvider implements AuthenticationProvider {

    @Value("${firebase.api.key:}")
    private String firebaseApiKey;

    // Do not call FirebaseAuth.getInstance() here — FirebaseApp may not be initialized yet.
    // We'll obtain FirebaseAuth lazily inside authenticate().

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String email = authentication.getName();
        String password = String.valueOf(authentication.getCredentials());

        if (firebaseApiKey == null || firebaseApiKey.isBlank()) {
            throw new AuthenticationServiceException("Firebase API key not configured");
        }

        String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + firebaseApiKey;
        RestTemplate rest = new RestTemplate();
        Map<String,Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", password);
        payload.put("returnSecureToken", true);

        try {
            ResponseEntity<Map> resp = rest.postForEntity(url, payload, Map.class);
            Map body = resp.getBody();
            if (body == null || body.get("idToken") == null) {
                throw new BadCredentialsException("Authentication failed");
            }
            String idToken = (String) body.get("idToken");

            FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();
            FirebaseToken decoded = firebaseAuth.verifyIdToken(idToken);
            String uid = decoded.getUid();

            Collection<GrantedAuthority> authorities = new ArrayList<>();
            Object role = decoded.getClaims().get("role");
            if (role != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toString()));
            } else {
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
            auth.setDetails(Map.of("uid", uid));
            return auth;

        } catch (HttpClientErrorException e) {
            throw new BadCredentialsException("Invalid credentials", e);
        } catch (FirebaseAuthException e) {
            throw new AuthenticationServiceException("Firebase token verification failed", e);
        }
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
