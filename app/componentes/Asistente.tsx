'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';

export default function Asistente() {
  const [entrada, setEntrada] = useState('');
  const { messages, sendMessage, status, error } = useChat();
  const conversacionRef = useRef<HTMLDivElement>(null);

  // Cuando el asistente termina de hablar puede haber creado tareas con
  // sus herramientas: le avisamos a la lista que se recargue.
  useEffect(() => {
    if (status === 'ready') window.dispatchEvent(new Event('tareas-cambiaron'));
  }, [status]);

  useEffect(() => {
    const panel = conversacionRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages, status]);

  return (
    <div className="tarjeta">
      <h2>Asistente</h2>
      <p className="apagado">Consulta tus tareas o pídele que agregue una nueva.</p>

      <div className="conversacion" ref={conversacionRef} aria-live="polite">
        {messages.length === 0 ? (
          <p className="apagado">
            Prueba: «¿qué tengo pendiente de Karla?» o «agrega una tarea para
            revisar el PR el viernes, prioridad alta».
          </p>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className={'burbuja ' + m.role}>
            <span className="quien">{m.role === 'user' ? 'Tú' : 'IA'}</span>

            {m.parts.map((parte, i) => {
              if (parte.type === 'text') {
                return <p key={i}>{parte.text}</p>;
              }
              // Las llamadas a herramientas también son partes del mensaje.
              // Mostrarlas no es adorno: es la única forma de ver qué pidió
              // el modelo y qué le contestó tu código.
              if (parte.type.startsWith('tool-')) {
                return (
                  <p key={i} className="herramienta">
                    herramienta · {parte.type.replace('tool-', '')}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ))}

        {status === 'submitted' || status === 'streaming' ? (
          <p className="apagado indicador-flujo" aria-live="polite">
            {status === 'submitted' ? 'Conectando con la IA…' : 'La IA está escribiendo…'}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="error" role="alert">
          {error.message || 'No se pudo completar la solicitud.'} Revisa que
          `.env.local` tenga una clave de Google AI Studio y reinicia el servidor.
        </p>
      ) : null}

      <form
        className="fila"
        onSubmit={(e) => {
          e.preventDefault();
          if (!entrada.trim()) return;
          sendMessage({ text: entrada });
          setEntrada('');
        }}
      >
        <input
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Escríbele al asistente…"
          autoComplete="off"
          maxLength={2000}
        />
        <button className="boton" type="submit" disabled={status !== 'ready'}>
          Enviar
        </button>
      </form>
    </div>
  );
}
