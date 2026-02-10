package mg.uem.mg.clouds5p17authapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CloudS5AuthApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(CloudS5AuthApiApplication.class, args);
	}

}
