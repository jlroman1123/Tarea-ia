import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type InferUITools,
  type UIMessage,
} from 'ai';
import { herramientas } from '../../../lib/herramientas';
import { modelo } from '../../../lib/modelo';

export const maxDuration = 30;

type MensajeChat = UIMessage<unknown, never, InferUITools<typeof herramientas>>;

const SISTEMA = `Eres el asistente de Tareas Pro, una aplicación de tareas de equipo.
Contestas en español, corto y directo: dos o tres frases, nunca párrafos.
Nunca inventes tareas que no hayas visto: si no sabes, búscalas primero.
Si el usuario pide agregar algo, agrégalo de verdad con la herramienta.`;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'El cuerpo debe ser JSON válido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'El cuerpo debe ser un objeto JSON con mensajes.' }, { status: 400 });
  }
  const rawMessages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return Response.json({ error: 'Escribe un mensaje antes de enviar.' }, { status: 400 });
  }

  const validacion = await safeValidateUIMessages<MensajeChat>({
    messages: rawMessages,
    tools: herramientas,
  });
  if (!validacion.success) {
    return Response.json({ error: 'El formato de los mensajes no es válido. Vuelve a enviar tu mensaje.' }, { status: 400 });
  }
  const messages = validacion.data;
  const textLength = messages.flatMap((m) => m.parts)
    .reduce((total, p) => total + (p.type === 'text' ? p.text.length : 0), 0);
  if (textLength > 6000) {
    return Response.json({ error: 'La conversación supera 6,000 caracteres. Resume el texto e inténtalo de nuevo.' }, { status: 413 });
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    return Response.json(
      { error: 'Falta configurar GOOGLE_GENERATIVE_AI_API_KEY en el archivo .env.local. Reinicia el servidor después de guardarlo.' },
      { status: 503 },
    );
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch {
    return Response.json({ error: 'No se pudo interpretar la conversación. Inicia un mensaje nuevo e inténtalo otra vez.' }, { status: 400 });
  }

  const result = streamText({
    model: modelo(),
    system: SISTEMA,

    messages: modelMessages,
    tools: herramientas,
    // 5 pasos permiten buscar/crear y redactar respuesta sin un bucle costoso.
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}

