package com.example.demo2.services;

import com.example.demo2.models.Tienda;
import java.util.List;

public interface TiendaService {

    List<Tienda> getAll();

    Tienda getById(Long id);

    Tienda create(Tienda tienda);

    void delete(Long id);
}



