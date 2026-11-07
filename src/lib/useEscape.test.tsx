// @vitest-environment jsdom
import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEscape } from './useEscape'

describe('useEscape (pila)', () => {
  it('con listeners apilados solo dispara el de arriba', () => {
    const abajo = vi.fn()
    const arriba = vi.fn()
    renderHook(() => useEscape(true, abajo))
    const top = renderHook(() => useEscape(true, arriba))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(arriba).toHaveBeenCalledTimes(1)
    expect(abajo).not.toHaveBeenCalled()
    top.unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(abajo).toHaveBeenCalledTimes(1)
  })

  it('inactivo no escucha', () => {
    const fn = vi.fn()
    renderHook(() => useEscape(false, fn))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(fn).not.toHaveBeenCalled()
  })
})
