package mg.sig;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilitaire pour générer des hashs BCrypt
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        System.out.println("=== Génération des hashs BCrypt ===\n");
        
        String managerPassword = "Manager2026!";
        String userPassword = "User2026!";
        
        String managerHash = encoder.encode(managerPassword);
        String userHash = encoder.encode(userPassword);
        
        System.out.println("Mot de passe Manager: " + managerPassword);
        System.out.println("Hash: " + managerHash);
        System.out.println("\nMot de passe User: " + userPassword);
        System.out.println("Hash: " + userHash);
        
        // Vérification
        System.out.println("\n=== Vérification ===");
        System.out.println("Manager hash valide: " + encoder.matches(managerPassword, managerHash));
        System.out.println("User hash valide: " + encoder.matches(userPassword, userHash));
    }
}
