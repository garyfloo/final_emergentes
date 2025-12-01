package com.example.demo2.services;

import com.example.demo2.models.Tienda;
import com.example.demo2.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TiendaServiceImpl implements TiendaService {

    @Autowired
    private TiendaRepository tiendaRepository;

    @Override
    public List<Tienda> getAll() {
        return tiendaRepository.findAll();
    }

    @Override
    public Tienda getById(Long id) {
        return tiendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada con id: " + id));
    }

    @Override
    public Tienda create(Tienda tienda) {
        return tiendaRepository.save(tienda);
    }

    @Override
    public void delete(Long id) {
        tiendaRepository.deleteById(id);
    }
}
