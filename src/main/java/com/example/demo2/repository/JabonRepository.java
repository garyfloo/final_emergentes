package com.example.demo2.repository;

import com.example.demo2.models.Jabon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JabonRepository extends JpaRepository<Jabon, Long> {
}
