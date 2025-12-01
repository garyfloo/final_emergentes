// TiendaController.java

package com.example.demo2.controllers;

import com.example.demo2.models.Tienda;
import com.example.demo2.services.TiendaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tiendas") // ¡CORRECCIÓN CLAVE PARA ELIMINAR EL ERROR DE COMUNICACIÓN!
@CrossOrigin(origins = "*")
public class TiendaController {

    @Autowired
    private TiendaService tiendaService;

    // ✅ Obtener todas las tiendas (GET /api/tiendas)
    @GetMapping
    public List<Tienda> getAll() {
        return tiendaService.getAll();
    }

    // ✅ Crear una nueva tienda (POST /api/tiendas)
    @PostMapping
    public Tienda create(@RequestBody Tienda tienda) {
        return tiendaService.create(tienda);
    }

    // ✅ Obtener una tienda por ID (GET /api/tiendas/{id})
    @GetMapping("/{id}")
    public Tienda getById(@PathVariable Long id) {
        return tiendaService.getById(id);
    }

    // ✅ Eliminar una tienda (DELETE /api/tiendas/{id})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        tiendaService.delete(id);
    }
}
