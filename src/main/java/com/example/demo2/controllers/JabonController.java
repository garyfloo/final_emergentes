// JabonController.java (CORREGIDO)

package com.example.demo2.controllers;

import com.example.demo2.models.Jabon;
import com.example.demo2.models.Tienda;
import com.example.demo2.services.JabonService;
import com.example.demo2.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jabones") // ¡CORRECCIÓN CLAVE APLICADA! Ahora incluye /api
@CrossOrigin(origins = "*")
public class JabonController {

    @Autowired
    private JabonService jabonService;

    @Autowired
    private TiendaRepository tiendaRepository;

    // ✅ Obtener todos los jabones (GET /api/jabones)
    @GetMapping
    public List<Jabon> getAll() {
        return jabonService.getAll();
    }

    // ✅ Obtener un jabón por ID (GET /api/jabones/{id})
    @GetMapping("/{id}")
    public Jabon getById(@PathVariable Long id) {
        return jabonService.getById(id);
    }

    // ✅ Crear jabón sin tienda asociada (POST /api/jabones)
    @PostMapping
    public Jabon create(@RequestBody Jabon jabon) {
        return jabonService.create(jabon);
    }

    // ✅ Crear jabón asociado a una tienda existente (POST /api/jabones/tienda/{tiendaId})
    @PostMapping("/tienda/{tiendaId}")
    public Jabon createInTienda(@PathVariable Long tiendaId, @RequestBody Jabon jabon) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada con id: " + tiendaId));

        jabon.setTienda(tienda);
        return jabonService.create(jabon);
    }

    // ✅ Obtener todos los jabones de una tienda específica (GET /api/jabones/tienda/{tiendaId})
    @GetMapping("/tienda/{tiendaId}")
    public List<Jabon> getJabonesPorTienda(@PathVariable Long tiendaId) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada con id: " + tiendaId));
        return tienda.getJabones();
    }

    // ✅ Actualizar jabón (PUT /api/jabones/{id})
    @PutMapping("/{id}")
    public Jabon update(@PathVariable Long id, @RequestBody Jabon jabon) {
        return jabonService.update(id, jabon);
    }

    // ✅ Eliminar jabón (DELETE /api/jabones/{id})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        jabonService.delete(id);
    }
}


