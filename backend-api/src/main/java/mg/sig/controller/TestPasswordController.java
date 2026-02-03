package mg.sig.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur temporaire pour tester les mots de passe
 * À SUPPRIMER EN PRODUCTION
 */
@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestPasswordController {

    private final PasswordEncoder passwordEncoder;

    @GetMapping("/hash/{password}")
    public Map<String, String> hashPassword(@PathVariable String password) {
        String hash = passwordEncoder.encode(password);
        Map<String, String> result = new HashMap<>();
        result.put("password", password);
        result.put("hash", hash);
        result.put("verified", String.valueOf(passwordEncoder.matches(password, hash)));
        return result;
    }

    @PostMapping("/verify")
    public Map<String, Object> verifyPassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hash = request.get("hash");
        
        boolean matches = passwordEncoder.matches(password, hash);
        
        Map<String, Object> result = new HashMap<>();
        result.put("password", password);
        result.put("hash", hash);
        result.put("matches", matches);
        
        return result;
    }
}
