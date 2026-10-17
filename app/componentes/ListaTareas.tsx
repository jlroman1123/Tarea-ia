'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Tarea } from '../../lib/tareas';

export default function ListaTareas() {
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [error, setError] = useState(false);

  const recargar = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch('/api/tareas', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resultado: unknown = await res.json();
      if (!Array.isArray(resultado)) throw new Error('Formato de respuesta inválido');
      setTareas(resultado as Tarea[]);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    recargar();
    // Cuando la IA agrega algo, avisa por aquí y la lista se recarga.
    window.addEventListener('tareas-cambiaron', recargar);
    return () => window.removeEventListener('tareas-cambiaron', recargar);
  }, [recargar]);

  return (
    <div className="tarjeta">
      <h2>Tareas</h2>

      {error ? (
        <>
          <p className="error" role="alert">
            No se pudo cargar la lista. Confirma que abriste la app desde
            http://localhost:3000 y que npm run dev siga activo.
          </p>
          <button className="boton" onClick={recargar}>Reintentar</button>
        </>
      ) : tareas === null ? (
        <p className="apagado">Cargando…</p>
      ) : tareas.length === 0 ? (
        <p className="apagado">Todavía no hay tareas.</p>
      ) : (
        <ul className="lista">
          {tareas.map((t) => (
            <li key={t.id}>
              <span className={'pastilla p-' + t.prioridad}>{t.prioridad}</span>
              <span className="titulo">{t.titulo}</span>
              <span className="meta">
                {t.responsable ?? 'sin asignar'}
                {t.origen !== 'manual' ? ' · ' + t.origen : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
