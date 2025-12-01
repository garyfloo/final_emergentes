// Archivo: src/main/java/com/example/demo2/models/Jabon.java (COMPLETO Y CORREGIDO)

package com.example.demo2.models;

import jakarta.persistence.*;

@Entity
@Table(name = "jabones")
public class Jabon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String marca;
    private String fragancia;
    private double precio;
    private int stock;
    private String tipo;

    // 🔹 Relación con Tienda
    // Corrección para permitir NULL si el formulario no envía tienda_id:
    @ManyToOne(optional = true)
    @JoinColumn(name = "tienda_id")
    private Tienda tienda;

    // 🔹 Getters y Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // --- GETTERS Y SETTERS QUE FALTABAN O CAUSABAN EL ERROR EN EL SERVICIO ---

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getFragancia() {
        return fragancia;
    }

    public void setFragancia(String fragancia) {
        this.fragancia = fragancia;
    }

    public double getPrecio() {
        return precio;
    }

    public void setPrecio(double precio) {
        this.precio = precio;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    // ------------------------------------------------------------------------

    public Tienda getTienda() {
        return tienda;
    }

    public void setTienda(Tienda tienda) {
        this.tienda = tienda;
    }
}


