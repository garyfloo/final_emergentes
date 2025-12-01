package com.example.demo2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo2.models.Tienda;

public interface TiendaRepository extends JpaRepository<Tienda, Long> {
}

