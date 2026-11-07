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

describe('App (ingresos en USD)', () => {
  const leer = () => JSON.parse(localStorage.getItem('miplan_v1') ?? '{}')

  it('un ingreso USD crea el bolsillo "Dólares" y no cuenta como pesos', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Registrar movimiento'))
    fireEvent.click(screen.getByText('Ingreso'))
    fireEvent.click(screen.getByText('Dólares (USD)'))
    expect(screen.getByText(/se creará un bolsillo/)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1,250.50' } })
    fireEvent.click(screen.getByText('Guardar'))

    const s = leer()
    expect(s.bolsillos).toHaveLength(1)
    expect(s.bolsillos[0]).toMatchObject({ nombre: 'Dólares', moneda: 'USD', saldo: 1250.5 })
    expect(s.movimientos[0]).toMatchObject({
      tipo: 'ingreso',
      moneda: 'USD',
      monto: 1250.5,
      bolsilloId: s.bolsillos[0].id,
    })
  })
})

describe('App (sheets)', () => {
  it('el modal de registro se cierra con Escape y con el botón Cerrar', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Registrar movimiento'))
    expect(screen.getByText('Categoría')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Categoría')).toBeNull()

    fireEvent.click(screen.getByLabelText('Registrar movimiento'))
    fireEvent.click(screen.getByLabelText('Cerrar'))
    expect(screen.queryByText('Categoría')).toBeNull()
  })
})
