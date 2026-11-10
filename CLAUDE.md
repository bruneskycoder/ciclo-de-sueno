# A la Luz del Fogón — notas para Claude Code

- El plan vivo es [`PLAN-v3.md`](./PLAN-v3.md). [`PLAN.md`](./PLAN.md) es
  el de la v2 y queda como historia.
- Todo texto visible de la app pasa por la skill de voz:
  [`.claude/skills/voz/SKILL.md`](./.claude/skills/voz/SKILL.md).
- El autor no programa: lo que se le diga tiene que poder comprobarse sin
  leer código.

## Ahorrar uso: avisar siempre qué modelo conviene

Pedido explícito de Bruno. **Antes de arrancar una etapa o una tarea
grande, y al terminarla, decile qué modelo conviene para lo que sigue y si
conviene abrir una sesión nueva** en vez de seguir en la actual. Vos no
podés cambiar el modelo: lo elige él al abrir la sesión. Tu parte es
avisar.

El criterio, medido en la sesión que armó el plan v3:

- **Sesión nueva por etapa.** Una conversación larga se relee entera en
  cada respuesta, y eso pesa más que la diferencia de precio entre
  modelos: en esa sesión, con 350 mil tokens de contexto, releer y
  guardar contexto era entre el 60 y el 80% del gasto. El traspaso entre
  sesiones es el plan, no la conversación.
- **Sonnet 5.5** para trabajo con plan detallado y una verificación por
  paso: la Etapa A del plan v3. Cuesta la mitad que Opus.
- **Opus 5.5** para lo que depende de criterio visual o de diseño: la
  Etapa B, la escena. El fogón necesitó cuatro intentos en la v2; un
  modelo que necesita más vueltas sale más caro por tarea terminada.
- **Haiku**, no, para este repo.
