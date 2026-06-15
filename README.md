# Mi Plan 💚

PWA mobile-first de finanzas personales para **salir de deudas** con la estrategia
bola de nieve (avalancha híbrida). En español.

## Estado

Proyecto en arranque. Hoy la carpeta contiene el **prototipo HTML funcional** y la
documentación. El código React aún no existe — ese es el siguiente paso (Fase 1).

## Stack

Vite · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth) · PWA
(local-first con sincronización en segundo plano).

## Secciones

1. **Inicio** — deuda total restante, progreso, stats del mes.
2. **Deudas** — lista por estrategia de ataque, abonos, intereses del mes.
3. **Gastos** — registro, donut por categoría, alerta de gastos hormiga.
4. **Plan** — plan mes a mes (14 meses) hasta liquidar todo.

## Documentación

| Archivo | Para qué |
|---------|----------|
| [CLAUDE.md](CLAUDE.md) | Guía maestra: visión, modelo de datos, fórmulas, fases, seguridad. **Empieza aquí.** |
| [AGENT.md](AGENT.md) | Resumen corto para agentes de IA. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Diseño técnico y flujo de sincronización. |
| [supabase_schema.sql](supabase_schema.sql) | Esquema de la base de datos (córrelo en Supabase). |
| [.claude/skills/motor-finanzas/SKILL.md](.claude/skills/motor-finanzas/SKILL.md) | Lógica de dominio reutilizable. |
| [MiPlan_Supabase.html](MiPlan_Supabase.html) | Prototipo funcional — fuente de verdad visual y de lógica. |

## Puesta en marcha (cuando exista el código)

```bash
cp .env.example .env     # rellena tus credenciales de Supabase
npm install
npm run dev
```

Corre [supabase_schema.sql](supabase_schema.sql) en el SQL Editor de Supabase y
habilita el login anónimo (Authentication → Providers → Anonymous).

## Seguridad

- Credenciales solo en `.env` (ya está en `.gitignore`). Solo la **anon/publishable
  key** va al frontend; la **secret key jamás**.
- RLS activo: cada usuario solo ve sus datos.
- En Vercel, las credenciales van en *Environment Variables*.
