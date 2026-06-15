// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('App (smoke)', () => {
  it('monta y muestra el resumen con la deuda total', () => {
    render(<App />)
    expect(screen.getByText('DEUDA TOTAL RESTANTE')).toBeTruthy()
    expect(screen.getByText('Próximo objetivo')).toBeTruthy()
    // Sin sesión, el chip de cuenta del sidebar muestra "Invitado"
    expect(screen.getByText('Invitado')).toBeTruthy()
  })

  it('navega a Perfil y muestra los datos personales y el acceso de cuenta', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Perfil')[0])
    expect(screen.getByText('Datos personales')).toBeTruthy()
    expect(screen.getByText('Nombre')).toBeTruthy()
    expect(screen.getByText('Teléfono')).toBeTruthy()
  })

  it('navega a Deudas y muestra el botón de intereses', () => {
    render(<App />)
    // Sidebar + NavBar comparten labels (uno se oculta por CSS): tomamos el primero.
    fireEvent.click(screen.getAllByText('Deudas')[0])
    expect(screen.getByText(/Aplicar intereses de/)).toBeTruthy()
    // La primera deuda objetivo (menor orden) es Banco Bogotá LATAM
    expect(screen.getByText('⚡ OBJETIVO ACTUAL')).toBeTruthy()
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
})
