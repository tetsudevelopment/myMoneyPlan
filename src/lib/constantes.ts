// =====================================================================
//  Constantes de dominio de Mi Plan
//  Tomadas del prototipo (MiPlan_Supabase.html). Sirven de semilla y de
//  catálogo de categorías. Las 9 deudas reales viven en Supabase (seed),
//  pero se conservan aquí como respaldo para el modo solo-local.
// =====================================================================

import type { Categoria, Deuda } from '../types'

/** Suma de los saldos iniciales de las 9 deudas. Base del progreso total. */
export const DEUDA_INICIAL_TOTAL = 49_982_845

/** Las 9 deudas iniciales (respaldo local / semilla). */
export const DEUDAS_INIT: Deuda[] = [
  { id: 'latam', nombre: 'Banco Bogotá LATAM', tipo: 'tarjeta', saldoInicial: 1522706, saldo: 1522706, cuota: 123000, tasaEA: 24.33, orden: 1 },
  { id: 'oro', nombre: 'BBVA Oro', tipo: 'tarjeta', saldoInicial: 3816360, saldo: 3816360, cuota: 189906, tasaEA: 28.79, orden: 2 },
  { id: 'nu', nombre: 'Nu', tipo: 'tarjeta', saldoInicial: 4186590, saldo: 4186590, cuota: 846984, tasaEA: 25.0, orden: 3 },
  { id: 'aqua', nombre: 'BBVA AQUA', tipo: 'tarjeta', saldoInicial: 8129239, saldo: 8129239, cuota: 335784, tasaEA: 28.17, orden: 4 },
  { id: 'libredest', nombre: 'Banco Bogotá Libre Destino', tipo: 'credito', saldoInicial: 4210461, saldo: 4210461, cuota: 130061, tasaEA: 26.08, orden: 5 },
  { id: 'prestamo1', nombre: 'BBVA Préstamo 1', tipo: 'credito', saldoInicial: 3925012, saldo: 3925012, cuota: 147586, tasaEA: 26.35, orden: 6 },
  { id: 'claro', nombre: 'Claro Xiaomi', tipo: 'credito', saldoInicial: 3852103, saldo: 3852103, cuota: 233451, tasaEA: 25.19, orden: 7 },
  { id: 'prestamo2', nombre: 'BBVA Préstamo 2', tipo: 'credito', saldoInicial: 3888700, saldo: 3888700, cuota: 125824, tasaEA: 21.55, orden: 8 },
  { id: 'finecoop', nombre: 'Finecoop', tipo: 'credito', saldoInicial: 16451674, saldo: 16451674, cuota: 722428, tasaEA: 21.0, orden: 9 },
]

/** Catálogo de categorías de gasto. */
export const CATEGORIAS: Categoria[] = [
  { id: 'mercado', nombre: 'Mercado', icono: '🛒', color: '#1D9E75' },
  { id: 'gasolina', nombre: 'Gasolina', icono: '⛽', color: '#BA7517' },
  { id: 'servicios', nombre: 'Servicios', icono: '💡', color: '#378ADD' },
  { id: 'comida', nombre: 'Comer fuera', icono: '🍔', color: '#D85A30' },
  { id: 'suscrip', nombre: 'Suscripciones', icono: '📺', color: '#7F77DD' },
  { id: 'gaming', nombre: 'Gaming', icono: '🎮', color: '#D4537E' },
  { id: 'transporte', nombre: 'Transporte', icono: '🚌', color: '#0F6E56' },
  { id: 'salud', nombre: 'Salud', icono: '💊', color: '#E24B4A' },
  { id: 'familia', nombre: 'Familia', icono: '👨‍👩‍👦', color: '#993C1D' },
  { id: 'otros', nombre: 'Otros', icono: '📦', color: '#5F5E5A' },
]

/** Categorías consideradas "gasto hormiga". */
export const CATEGORIAS_HORMIGA = ['comida', 'gaming', 'suscrip', 'otros']

/** Lista completa: predefinidas + las que cree el usuario. */
export const todasCategorias = (extra: Categoria[] = []): Categoria[] => [...CATEGORIAS, ...extra]

/** Busca una categoría por id en la lista combinada; cae a "Otros" si no existe. */
export const catById = (id: string | undefined, extra: Categoria[] = []): Categoria =>
  todasCategorias(extra).find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1]

/** Config por defecto en modo solo-local. */
export const CONFIG_DEFAULT = { ingresoMensual: 5_800_000, presupuestoOcio: 120_000 }
