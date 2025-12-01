// Archivo: src/main/java/com/example/demo2/services/JabonService.java

package com.example.demo2.services;

import com.example.demo2.models.Jabon;
import com.example.demo2.repository.JabonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 👈 ¡IMPORTACIÓN NECESARIA!

import java.util.List;

@Service
@Transactional // 👈 ESTA LÍNEA ES LA SOLUCIÓN. Fuerza la confirmación del guardado en PostgreSQL.
public class JabonService {

    @Autowired
    private JabonRepository jabonRepository;

    public List<Jabon> getAll() {
        return jabonRepository.findAll();
    }

    public Jabon getById(Long id) {
        return jabonRepository.findById(id).orElse(null);
    }

    public Jabon create(Jabon jabon) {
        return jabonRepository.save(jabon);
    }

    public Jabon update(Long id, Jabon jabon) {
        Jabon existing = jabonRepository.findById(id).orElse(null);
        if (existing != null) {
            existing.setNombre(jabon.getNombre());
            existing.setFragancia(jabon.getFragancia());
            existing.setPrecio(jabon.getPrecio());
            existing.setStock(jabon.getStock());
            existing.setMarca(jabon.getMarca());
            existing.setTipo(jabon.getTipo());
            return jabonRepository.save(existing);
        }
        return null;
    }

    public void delete(Long id) {
        jabonRepository.deleteById(id);
    }
}