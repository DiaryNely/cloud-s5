package mg.uem.mg.clouds5p17authapi.config;

import java.io.File;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.annotation.PostConstruct;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    public static final String UPLOAD_DIR = "uploads/signalements/";

    @PostConstruct
    public void init() {
        // Créer le répertoire uploads au démarrage de l'application
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
            System.out.println("✅ Répertoire uploads créé: " + directory.getAbsolutePath());
        } else {
            System.out.println("✅ Répertoire uploads existe: " + directory.getAbsolutePath());
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir les fichiers uploadés depuis /uploads/**
        String absolutePath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize().toString();
        String fileUrl = "file:///" + absolutePath.replace("\\", "/") + "/";
        
        System.out.println("📂 Configuration resource handler:");
        System.out.println("   Pattern: /uploads/signalements/**");
        System.out.println("   Location: " + fileUrl);
        
        registry.addResourceHandler("/uploads/signalements/**")
                .addResourceLocations(fileUrl);
    }
}
