# AGENT.md

Archivo de instrucciones para agentes de IA (Claude Code, Cursor, etc.). Es
intencionalmente corto: **la guía completa vive en [CLAUDE.md](CLAUDE.md)**. Léela
primero.

## Resumen de 30 segundos

- **Proyecto:** "Mi Plan", PWA mobile-first de finanzas para salir de deudas con la
  estrategia bola de nieve. Una sola persona por cuenta. En español.
- **Stack:** Vite + React + TypeScript + Tailwind + Supabase (Postgres + Auth, RLS on).
- **Patrón clave:** local-first. Guarda en localStorage y pinta al instante; sincroniza
  con Supabase en segundo plano; degrada a solo-local si no hay nube.
- **Fuente de verdad de diseño y lógica:** el prototipo [MiPlan_Supabase.html](MiPlan_Supabase.html).
  Calca su aspecto y comportamiento.

## Reglas que no debes romper

1. Credenciales solo en `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Nunca
   hardcodeadas. `.env` en `.gitignore`. Solo la anon/publishable key en el frontend.
2. No desactives RLS. Todo se filtra por `user_id`.
3. No añadas dependencias sin necesidad real.
4. La app debe funcionar sin internet y sin credenciales (modo solo-local).
5. Trabaja por fases (ver CLAUDE.md §9) y prueba cada una antes de seguir.

## Dónde está cada cosa

- Visión, modelo de datos, fórmulas, fases, seguridad → **CLAUDE.md**
- Diseño del sistema y flujo de sync → **ARCHITECTURE.md**
- Esquema de base de datos → **supabase_schema.sql**
- Lógica de dominio reutilizable → skill en `.claude/skills/motor-finanzas/SKILL.md`

> Nota: si tu herramienta busca `AGENTS.md` (plural) en vez de `AGENT.md`, este
> contenido aplica igual. Mantén ambos sincronizados si creas el plural.
