package com.pdks.backend;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
@Slf4j
public class PdksBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PdksBackendApplication.class, args);
	}

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Istanbul"));
		log.info("Sistem Saat Dilimi Sabitlendi: " + TimeZone.getDefault().getID());
	}
}
