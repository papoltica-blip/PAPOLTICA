
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ======================================
// 1. CONFIGURACIÓN DEL SERVIDOR
// ======================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const OLLAMA_URL = (
    process.env.OLLAMA_URL || "http://127.0.0.1:11434"
).replace(/\/+$/, "");

const MODELO = "qwen2.5:3b";

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

// ======================================
// 2. PÁGINA PRINCIPAL
// ======================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "APP PAPOLTICA.html"));
});

app.get("/inicio", (req, res) => {
    res.sendFile(path.join(__dirname, "APP PAPOLTICA.html"));
});

// ======================================
// 3. IDENTIDAD DE PAPOLTICA
// ======================================

const instruccionesPAPOLTICA = `
Eres PAPOLTICA, una tutora inteligente de matemáticas
y ciencias.

Tu objetivo es ayudar al estudiante a comprender,
razonar y resolver problemas por sí mismo.

PERSONALIDAD:
- Paciente, amable y motivadora.
- Natural y cercana, sin exagerar.
- Nunca hagas sentir mal al estudiante.
- Utiliza palabras sencillas.
- Adapta tus explicaciones a su nivel.

REGLAS GENERALES:
1. No des respuestas innecesariamente largas.
2. Haz solamente una pregunta por respuesta.
3. Evita introducciones largas.
4. No utilices títulos innecesarios.
5. No repitas información que el estudiante ya conoce.
6. Utiliza el historial para continuar la conversación.
7. No reinicies un ejercicio que ya está en proceso.

MODO ASISTENTE IA:

Cuando el estudiante presente un ejercicio nuevo:
- Identifica qué necesita resolver.
- Dale una pista pequeña.
- Haz una pregunta que lo ayude a pensar.
- Espera su respuesta.

Cuando responda correctamente:
- Felicítalo brevemente.
- Explica por qué su respuesta es correcta.
- Continúa con el siguiente paso mediante otra pregunta.

Cuando se equivoque:
- No le des inmediatamente la respuesta.
- Explícale qué debe revisar.
- Proporciona una pista diferente.
- Vuelve a preguntarle.

Cuando no comprenda:
- Utiliza palabras más sencillas.
- Explica con un ejemplo cotidiano.
- Comprueba si entendió.

Si solicita la solución completa:
- Puedes mostrarla.
- Explica cada paso de manera sencilla.

MODO APRENDIZAJE:

Cuando el estudiante quiera aprender un tema desde cero:

1. Comienza con una explicación sencilla.
2. Presenta los conceptos importantes.
3. Explica las fórmulas necesarias, si existen.
4. Muestra un ejemplo resuelto paso a paso.
5. Haz una pregunta para comprobar su comprensión.
6. Después propón un ejercicio para practicar.

No presentes toda la información de golpe.
Avanza por pequeñas partes y espera la participación
del estudiante.

CONTINUIDAD:

- Recuerda el ejercicio actual.
- Utiliza las respuestas anteriores.
- Continúa desde el último paso.
- No confundas una respuesta nueva con un ejercicio anterior.

REGLA PRINCIPAL:

Tu función no es solamente resolver ejercicios.
Tu función es enseñar al estudiante a resolverlos.
`;

// ======================================
// 4. ESTADO DEL SERVIDOR
// ======================================

app.get("/api/estado", (req, res) => {
    res.json({
        funcionando: true,
        mensaje: "PAPOLTICA está conectada.",
        modelo: MODELO
    });
});

// ======================================
// 5. CONEXIÓN CON LA INTELIGENCIA ARTIFICIAL
// ======================================

app.post("/api/tutor", async (req, res) => {

    try {

        const { tema, historial, modo } = req.body;

        // VALIDAR TEMA

        if (
            typeof tema !== "string" ||
            !tema.trim() ||
            tema.length > 100
        ) {
            return res.status(400).json({
                error: "Selecciona un tema válido."
            });
        }

        // VALIDAR MODO

        const modoActual = modo || "asistente";

        if (!["aprendizaje", "asistente"].includes(modoActual)) {
            return res.status(400).json({
                error: "El modo seleccionado no es válido."
            });
        }

        // VALIDAR HISTORIAL

        if (
            !Array.isArray(historial) ||
            historial.length === 0 ||
            historial.length > 20
        ) {
            return res.status(400).json({
                error: "La conversación no es válida."
            });
        }

        const mensajesValidos = historial.every(mensaje =>
            mensaje &&
            ["user", "assistant"].includes(mensaje.role) &&
            typeof mensaje.content === "string" &&
            mensaje.content.trim().length > 0 &&
            mensaje.content.length <= 4000
        );

        if (!mensajesValidos) {
            return res.status(400).json({
                error: "Uno de los mensajes no es válido."
            });
        }

        // COMPROBAR ORDEN DE LOS MENSAJES

        for (let i = 0; i < historial.length; i++) {

            const rolEsperado = i % 2 === 0
                ? "user"
                : "assistant";

            if (historial[i].role !== rolEsperado) {
                return res.status(400).json({
                    error: "El orden de la conversación no es válido."
                });
            }
        }

        if (
            historial[0].role !== "user" ||
            historial[historial.length - 1].role !== "user"
        ) {
            return res.status(400).json({
                error: "Se esperaba un mensaje del estudiante."
            });
        }

        // ======================================
        // 6. INSTRUCCIONES SEGÚN EL MODO
        // ======================================

        const instruccionesModo = modoActual === "aprendizaje"
            ? `
MODO ACTIVO: APRENDIZAJE.

El estudiante quiere aprender el tema: ${tema}.

Enséñale desde cero.
Comienza con una explicación sencilla y breve.
Avanza gradualmente por conceptos y ejemplos.
Comprueba su comprensión con preguntas.
No avances demasiado rápido.
`
            : `
MODO ACTIVO: ASISTENTE IA.

El tema seleccionado es: ${tema}.

El estudiante puede presentar ejercicios o dudas.
Guíalo mediante preguntas y pistas.
No resuelvas todo de inmediato.
Continúa desde el último mensaje de la conversación.
`;

        const mensajes = [
            {
                role: "system",
                content: instruccionesPAPOLTICA + instruccionesModo
            },

            ...historial.map(mensaje => ({
                role: mensaje.role,
                content: mensaje.content
            }))
        ];

        // ======================================
        // 7. ENVIAR MENSAJES A OLLAMA
        // ======================================

        const respuesta = await fetch(
            `${OLLAMA_URL}/api/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    ...(process.env.OLLAMA_API_KEY
                        ? {
                            "Authorization":
                                `Bearer ${process.env.OLLAMA_API_KEY}`
                        }
                        : {})
                },

                signal: AbortSignal.timeout(120000),

                body: JSON.stringify({
                    model: MODELO,
                    stream: false,
                    messages: mensajes,

                    options: {
                        temperature: 0.3,
                        num_predict: 180
                    }
                })
            }
        );

        // ======================================
        // 8. COMPROBAR RESPUESTA DE OLLAMA
        // ======================================

        if (!respuesta.ok) {
            throw new Error(
                `Ollama respondió con el estado ${respuesta.status}.`
            );
        }

        const datos = await respuesta.json();

        if (
            !datos.message ||
            typeof datos.message.content !== "string" ||
            !datos.message.content.trim()
        ) {
            throw new Error(
                "Ollama no devolvió una respuesta válida."
            );
        }

        // ======================================
        // 9. DEVOLVER RESPUESTA A PAPOLTICA
        // ======================================

        res.json({
            respuesta: datos.message.content,
            modo: modoActual,
            tema: tema
        });

    } catch (error) {

        console.error("Error en PAPOLTICA:", error);

        const mensajeError =
            error.name === "TimeoutError" ||
            error.name === "AbortError"
                ? "La respuesta tardó demasiado. Inténtalo nuevamente."
                : "No se pudo conectar con PAPOLTICA. Comprueba que Ollama esté funcionando y que Qwen 2.5:3B esté instalado.";

        res.status(500).json({
            error: mensajeError
        });

    }

});

// ======================================
// 10. INICIAR SERVIDOR
// ======================================

app.listen(PORT, () => {

    console.log("----------------------------------");
    console.log(" PAPOLTICA está funcionando");
    console.log(` http://localhost:${PORT}`);
    console.log(` Modelo: ${MODELO}`);
    console.log("----------------------------------");

});
