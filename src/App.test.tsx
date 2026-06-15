// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { CONFIG_DEFAULT, DEUDAS_INIT } from './lib/constantes'

// Simula un usuario ya configurado (onboarded) con las deudas de ejemplo.
function sembrarConDeudas() {
  localStorage.setItem('miplan_onboarded', '1')
  localStorage.setItem(
    'miplan_v1',
    JSON.stringify({
      deudas: DEUDAS_INIT,
      movimientos: [],
      interesesAplicados: [],
      config: CONFIG_DEFAULT,
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sembrarConDeudas()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('App (smoke)', () => {
  it('monta y muestra el resumen con el flujo del mes (sin deudas al frente)', () => {
    render(<App />)
    expect(screen.getByText(/DISPONIBLE EN/)).toBeTruthy()
    expect(screen.getByText('Ingresos vs gastos')).toBeTruthy()
    expect(screen.getByText('Invitado')).toBeTruthy()
  })

  it('navega a Deudas y muestra el total, el objetivo y agregar deuda', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Deudas')[0])
    // El hero de deuda con barra de progreso vive aquí ahora
    expect(screen.getByText('DEUDA TOTAL RESTANTE')).toBeTruthy()
    expect(screen.getByText(/Aplicar intereses de/)).toBeTruthy()
    expect(screen.getByText('⚡ OBJETIVO ACTUAL')).toBeTruthy()
    expect(screen.getByText('+ Agregar deuda')).toBeTruthy()
  })

  it('navega al Plan y calcula meses para ser libre', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Plan')[0])
    expect(screen.getByText(/Libre en \d+ meses/)).toBeTruthy()
  })

  it('abre el modal de registro al tocar el FAB', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Registrar movimiento'))
    expect(screen.getByText('Registrar movimiento')).toBeTruthy()
    expect(screen.getByText('Categoría')).toBeTruthy()
  })

  it('navega a Perfil y muestra los datos personales', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Perfil')[0])
    expect(screen.getByText('Datos personales')).toBeTruthy()
    expect(screen.getByText('Nombre')).toBeTruthy()
    expect(screen.getByText('Teléfono')).toBeTruthy()
  })
})

describe('App (onboarding)', () => {
  it('muestra la configuración inicial cuando el usuario no está onboarded', () => {
    localStorage.clear() // sin flag de onboarded ni deudas
    render(<App />)
    expect(screen.getByText('Bienvenido a Mi Plan')).toBeTruthy()
  })
})
