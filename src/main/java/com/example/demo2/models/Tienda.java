package com.example.demo2.models;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // 👈 NECESARIA

@Entity
@Table(name = "tiendas")
public class Tienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String direccion;

    // 🔹 Solución al error JSON: Ignorar la referencia de Jabones al listar Tiendas.
    // Esto rompe el bucle Tienda -> Jabon -> Tienda
    @OneToMany(mappedBy = "tienda", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("tienda") // 👈 AÑADIR ESTA ANOTACIÓN
    private List<Jabon> jabones;

    // 🔹 Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public List<Jabon> getJabones() {
        return jabones;
    }

    public void setJabones(List<Jabon> jabones) {
        this.jabones = jabones;
    }
}


