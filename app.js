
// ======================================
// 1. CONFIGURACIÓN GENERAL
// ======================================

function comenzar() {
    document.getElementById("aprendizaje")?.scrollIntoView({
        behavior: "smooth"
    });
}

let moduloActivo = "";
let modoActivo = "asistente";
let historialConversacion = [];
let vozPAPOLTICA = null;
let consultaEnCurso = false;


// ======================================
// 2. BASE DE EJERCICIOS
// ======================================

const ejercicios = {
    Ecuaciones: {
        titulo: "Álgebra",
        problema: "x + 5 = 12",
        pregunta: "¿Qué operación debemos realizar primero?",
        opciones: [
            { texto: "＋ Sumar 5", valor: "sumar" },
            { texto: "− Restar 5 en ambos lados", valor: "restar" },
            { texto: "× Multiplicar por 5", valor: "multiplicar" }
        ],
        correcta: "restar",
        formula: "x = 12 - 5",
        operacion: "12 - 5",
        resultado: 7,
        unidad: "",
        explicacion: "Restamos 5 en ambos lados para mantener la igualdad y dejar sola a la x.",
        pista: "Piensa en la operación contraria a sumar."
    },

    Electricidad: {
        titulo: "Electricidad",
        problema: "Un circuito tiene 12 V y una resistencia de 4 Ω. ¿Cuál es la corriente?",
        pregunta: "¿Qué fórmula necesitamos utilizar?",
        opciones: [
            { texto: "I = V / R", valor: "correcta" },
            { texto: "V = I × R", valor: "voltaje" },
            { texto: "R = V × I", valor: "resistencia" }
        ],
        correcta: "correcta",
        formula: "I = V / R",
        operacion: "12 / 4",
        resultado: 3,
        unidad: " A",
        explicacion: "La ley de Ohm indica que la corriente se obtiene dividiendo el voltaje entre la resistencia.",
        pista: "Recuerda la ley de Ohm: corriente = voltaje dividido entre resistencia."
    },

    Movimiento: {
        titulo: "Movimiento",
        problema: "Un automóvil recorre 120 km en 2 horas. ¿Cuál es su velocidad?",
        pregunta: "¿Qué fórmula permite calcular la velocidad?",
        opciones: [
            { texto: "Distancia × tiempo", valor: "multiplicar" },
            { texto: "Distancia / tiempo", valor: "correcta" },
            { texto: "Tiempo / distancia", valor: "dividir" }
        ],
        correcta: "correcta",
        formula: "v = d / t",
        operacion: "120 / 2",
        resultado: 60,
        unidad: " km/h",
        explicacion: "La velocidad se calcula dividiendo la distancia recorrida entre el tiempo empleado.",
        pista: "Para calcular la velocidad, divide la distancia entre el tiempo."
    },

    Proporcionalidad: {
        titulo: "Proporcionalidad",
        problema: "Si 3 cuadernos cuestan $45, ¿cuánto cuestan 5 cuadernos al mismo precio?",
        pregunta: "¿Qué procedimiento podemos utilizar?",
        opciones: [
            { texto: "Regla de tres", valor: "correcta" },
            { texto: "Restar 5 a 45", valor: "restar" },
            { texto: "Multiplicar 45 por 3", valor: "multiplicar" }
        ],
        correcta: "correcta",
        formula: "x = (45 × 5) / 3",
        operacion: "(45 × 5) / 3",
        resultado: 75,
        unidad: " pesos",
        explicacion: "Usamos una regla de tres porque el precio aumenta en la misma proporción que la cantidad de cuadernos.",
        pista: "Relaciona los 3 cuadernos con su precio y los 5 cuadernos con el precio que buscamos."
    }
};


// ======================================
// 3. SELECCIÓN DE MODO
// ======================================

function seleccionarModo(modo) {
    if (!["aprendizaje", "asistente"].includes(modo)) return;

    modoActivo = modo;
    historialConversacion = [];
    detenerVoz();

    const botonAprendizaje = document.getElementById("modo-aprendizaje");
    const botonAsistente = document.getElementById("modo-asistente");

    if (botonAprendizaje && botonAsistente) {
        botonAprendizaje.classList.toggle(
            "modo-seleccionado",
            modo === "aprendizaje"
        );

        botonAsistente.classList.toggle(
            "modo-seleccionado",
            modo === "asistente"
        );
    }

    const zonaTutor = document.getElementById("zona-tutor");

    if (zonaTutor) {
        zonaTutor.innerHTML = modo === "aprendizaje"
            ? `
                <h3>📚 Modo aprendizaje activado</h3>
                <p>
                    Selecciona un módulo para aprender desde cero,
                    conocer sus conceptos y practicar.
                </p>
            `
            : `
                <h3>🤖 Modo asistente IA activado</h3>
                <p>
                    Selecciona un módulo y escribe tus dudas o ejercicios.
                    PAPOLTICA te ayudará mediante pistas y preguntas.
                </p>
            `;
    }

    if (moduloActivo) {
        abrirModulo(moduloActivo);
    }
}


// ======================================
// 4. SISTEMA DE VOZ
// ======================================

function seleccionarVoz() {
    if (!("speechSynthesis" in window)) return;

    const voces = window.speechSynthesis.getVoices();

    const vocesEspanol = voces.filter(voz =>
        voz.lang.toLowerCase().startsWith("es")
    );

    vozPAPOLTICA =
        vocesEspanol.find(voz =>
            voz.lang.toLowerCase() === "es-mx" &&
            /female|mujer|paulina|monica|sabina/i.test(voz.name)
        ) ||
        vocesEspanol.find(voz =>
            voz.lang.toLowerCase() === "es-mx"
        ) ||
        vocesEspanol.find(voz =>
            /female|mujer|paulina|monica|sabina/i.test(voz.name)
        ) ||
        vocesEspanol[0] ||
        null;
}

if ("speechSynthesis" in window) {
    seleccionarVoz();
    window.speechSynthesis.onvoiceschanged = seleccionarVoz;
}


function limpiarTextoVoz(texto) {
    return texto
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/[_~]/g, "")
        .replace(/\$/g, " pesos ")
        .replace(/=/g, " es igual a ")
        .replace(/\+/g, " más ")
        .replace(/×/g, " por ")
        .replace(/÷/g, " entre ")
        .replace(/\//g, " entre ")
        .replace(/Ω/g, " ohms ")
        .replace(/°/g, " grados ")
        .replace(/\n+/g, ". ")
        .trim();
}


function hablarRespuesta(texto) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const textoLimpio = limpiarTextoVoz(texto);

    if (!textoLimpio) return;

    const mensaje = new SpeechSynthesisUtterance(textoLimpio);

    mensaje.lang = "es-MX";
    mensaje.rate = 0.95;
    mensaje.pitch = 1.08;
    mensaje.volume = 1;

    if (!vozPAPOLTICA) seleccionarVoz();

    if (vozPAPOLTICA) {
        mensaje.voice = vozPAPOLTICA;
    }

    window.speechSynthesis.speak(mensaje);
}


function detenerVoz() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}


// ======================================
// 5. ABRIR UN MÓDULO
// ======================================

function abrirModulo(nombre) {
    const ejercicio = ejercicios[nombre];

    if (!ejercicio) return;

    moduloActivo = nombre;
    historialConversacion = [];
    consultaEnCurso = false;

    detenerVoz();

    const tutor = document.getElementById("zona-tutor");

    if (!tutor) return;

    tutor.innerHTML = `
        <div class="panel-tutor">

            <span>TU ASISTENTE DE APRENDIZAJE</span>

            <h2>${ejercicio.titulo}</h2>

            <p>
                ${
                    modoActivo === "aprendizaje"
                    ? "Aprende este tema paso a paso."
                    : "Presenta tus dudas y PAPOLTICA te guiará."
                }
            </p>

            <div class="mision">

                <div class="mision-superior">
                    <span class="etiqueta-mision">
                        MISIÓN · ${ejercicio.titulo.toUpperCase()}
                    </span>

                    <span class="progreso-texto" id="texto-progreso">
                        PASO 1 DE 3
                    </span>
                </div>

                <div class="barra-progreso">
                    <div
                        class="progreso-actual"
                        id="progreso"
                        style="width: 33%"
                    ></div>
                </div>

                <h3>Tu desafío</h3>

                <div class="problema-destacado">
                    <p>OBSERVA EL PROBLEMA</p>
                    <h2>${ejercicio.problema}</h2>
                </div>

                <p class="pregunta-tutor">
                    ${ejercicio.pregunta}
                </p>

                <div class="opciones">
                    ${ejercicio.opciones.map((opcion, i) => `
                        <button
                            type="button"
                            onclick="comprobar('${opcion.valor}')"
                        >
                            <strong>${String.fromCharCode(65 + i)}.</strong>
                            ${opcion.texto}
                        </button>
                    `).join("")}
                </div>

                <div class="consulta-ia">

                    <h3>
                        ${
                            modoActivo === "aprendizaje"
                            ? "¿Quieres profundizar en el tema?"
                            : "¿Tienes otro ejercicio?"
                        }
                    </h3>

                    <p>
                        ${
                            modoActivo === "aprendizaje"
                            ? "Pide una explicación, un ejemplo o una práctica adicional."
                            : "Escribe tu ejercicio o pregunta y PAPOLTICA te ayudará a resolverlo."
                        }
                    </p>

                    <textarea
                        id="ejercicio-personal"
                        maxlength="4000"
                        placeholder="${
                            modoActivo === "aprendizaje"
                            ? "Ejemplo: Explícame qué es una ecuación..."
                            : "Ejemplo: Resuelve 3x + 5 = 20..."
                        }"
                    ></textarea>

                    <button
                        type="button"
                        id="boton-ia"
                        onclick="consultarIA()"
                    >
                        Consultar a PAPOLTICA →
                    </button>

                    <div
                        id="respuesta-ia"
                        class="respuesta-ia"
                        aria-live="polite"
                    ></div>

                    <div class="controles-voz">
                        <button
                            type="button"
                            onclick="detenerVoz()"
                        >
                            Detener voz
                        </button>
                    </div>

                </div>

                <div id="siguiente-paso"></div>
                <div id="respuesta"></div>

            </div>
        </div>
    `;

    tutor.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ======================================
// 6. ACTUALIZAR PROGRESO
// ======================================

function actualizarProgreso(porcentaje, texto) {
    const barra = document.getElementById("progreso");
    const textoProgreso = document.getElementById("texto-progreso");

    if (barra) {
        barra.style.width = porcentaje + "%";
    }

    if (textoProgreso) {
        textoProgreso.textContent = texto;
    }
}


// ======================================
// 7. COMPROBAR OPCIONES
// ======================================

function comprobar(opcion) {
    const ejercicio = ejercicios[moduloActivo];

    if (!ejercicio) return;

    const respuesta = document.getElementById("respuesta");
    const siguiente = document.getElementById("siguiente-paso");

    if (!respuesta || !siguiente) return;

    if (opcion === ejercicio.correcta) {
        actualizarProgreso(66, "PASO 2 DE 3");

        respuesta.innerHTML = `
            <div class="mensaje-tutor correcto">
                ✓ ¡Muy bien! Elegiste el procedimiento adecuado.
            </div>
        `;

        siguiente.innerHTML = `
            <div class="paso-tutor">

                <div class="numero-paso">
                    PASO 2 · DESARROLLO
                </div>

                <h3>Vamos a resolverlo</h3>

                <p>Esta es la expresión que utilizaremos:</p>

                <div class="formula-grande">
                    ${ejercicio.formula}
                </div>

                <p>
                    Ahora realiza la operación y escribe tu resultado.
                </p>

                <div class="campo-respuesta">

                    <input
                        type="number"
                        id="resultado"
                        placeholder="Escribe tu resultado"
                    >

                    <button
                        type="button"
                        class="boton-comprobar"
                        onclick="verificarResultado()"
                    >
                        Comprobar →
                    </button>

                </div>
            </div>
        `;
    } else {
        respuesta.innerHTML = `
            <div class="mensaje-tutor pista">
                <strong>¡No te rindas!</strong><br>
                ${ejercicio.pista}
            </div>
        `;

        siguiente.innerHTML = "";
    }
}


// ======================================
// 8. COMPROBAR RESULTADO
// ======================================

function verificarResultado() {
    const ejercicio = ejercicios[moduloActivo];

    if (!ejercicio) return;

    const campo = document.getElementById("resultado");
    const respuesta = document.getElementById("respuesta");
    const siguiente = document.getElementById("siguiente-paso");

    if (!campo || !respuesta || !siguiente) return;

    if (campo.value.trim() === "") {
        respuesta.innerHTML = `
            <div class="mensaje-tutor pista">
                Escribe un resultado antes de continuar.
            </div>
        `;
        return;
    }

    if (Number(campo.value) === ejercicio.resultado) {
        actualizarProgreso(100, "¡MISIÓN COMPLETADA!");

        siguiente.innerHTML = `
            <div class="resultado-final">

                <div class="estrella">★</div>

                <h3>¡Desafío completado!</h3>

                <p>Has llegado al resultado correcto.</p>

                <div class="formula-grande">
                    ${ejercicio.operacion} = ${ejercicio.resultado}${ejercicio.unidad}
                </div>

                <p><strong>¿Qué aprendiste?</strong></p>

                <p>${ejercicio.explicacion}</p>

                <button
                    type="button"
                    class="boton-reintentar"
                    onclick="abrirModulo('${moduloActivo}')"
                >
                    Volver a practicar ↻
                </button>

            </div>
        `;

        respuesta.innerHTML = "";
    } else {
        respuesta.innerHTML = `
            <div class="mensaje-tutor pista">
                <strong>¡Casi lo tienes!</strong><br>
                ${ejercicio.pista}
                Revisa tu operación e inténtalo otra vez.
            </div>
        `;
    }
}


// ======================================
// 9. MOSTRAR CONVERSACIÓN
// ======================================

function mostrarConversacion() {
    const respuesta = document.getElementById("respuesta-ia");

    if (!respuesta) return;

    respuesta.innerHTML = "";

    historialConversacion.forEach(mensaje => {
        const burbuja = document.createElement("div");

        burbuja.className = mensaje.role === "user"
            ? "mensaje-usuario"
            : "mensaje-papoltica";

        const nombre = document.createElement("strong");

        nombre.textContent = mensaje.role === "user"
            ? "TÚ"
            : "PAPOLTICA";

        const contenido = document.createElement("p");
        contenido.textContent = mensaje.content;

        burbuja.appendChild(nombre);
        burbuja.appendChild(contenido);

        respuesta.appendChild(burbuja);
    });

    respuesta.scrollTop = respuesta.scrollHeight;
}


// ======================================
// 10. CONSULTAR A PAPOLTICA
// ======================================

async function consultarIA() {
    const campo = document.getElementById("ejercicio-personal");
    const boton = document.getElementById("boton-ia");
    const respuesta = document.getElementById("respuesta-ia");

    if (!campo || !boton || !respuesta) return;
    if (consultaEnCurso) return;

    const ejercicio = campo.value.trim();

    if (!ejercicio) {
        respuesta.textContent = "Primero escribe un ejercicio o una pregunta.";
        return;
    }

    if (!moduloActivo) {
        respuesta.textContent = "Primero selecciona un módulo.";
        return;
    }

    if (ejercicio.length > 4000) {
        respuesta.textContent = "Tu mensaje es demasiado largo. Intenta resumirlo.";
        return;
    }

    const mensajeUsuario = {
        role: "user",
        content: ejercicio
    };

    historialConversacion.push(mensajeUsuario);

    // Conservar los últimos 20 mensajes para mantener
    // el contexto sin superar el límite del servidor.
    while (historialConversacion.length > 20) {
        historialConversacion.splice(0, 2);
    }

    campo.value = "";
    campo.disabled = true;
    boton.disabled = true;
    consultaEnCurso = true;
    boton.textContent = "PAPOLTICA está pensando...";

    respuesta.textContent = "PAPOLTICA está preparando tu respuesta...";

    try {
        const peticion = await fetch("/api/tutor", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tema: moduloActivo,
                modo: modoActivo,
                historial: historialConversacion
            })
        });

        const datos = await peticion.json();

        if (!peticion.ok) {
            throw new Error(datos.error || "Ocurrió un error.");
        }

        if (
            typeof datos.respuesta !== "string" ||
            !datos.respuesta.trim()
        ) {
            throw new Error("PAPOLTICA no devolvió una respuesta válida.");
        }

        historialConversacion.push({
            role: "assistant",
            content: datos.respuesta
        });

        mostrarConversacion();
        hablarRespuesta(datos.respuesta);

    } catch (error) {
        if (
            historialConversacion[historialConversacion.length - 1] ===
            mensajeUsuario
        ) {
            historialConversacion.pop();
        }

        respuesta.textContent =
            "No pude conectarme con PAPOLTICA: " + error.message;

        campo.value = ejercicio;

    } finally {
        campo.disabled = false;
        boton.disabled = false;
        consultaEnCurso = false;
        boton.textContent = "Consultar a PAPOLTICA →";
        campo.focus();
    }
}


// ======================================
// 11. RECOMENDACIONES POR WHATSAPP
// ======================================

function enviarRecomendacion() {
    const campo = document.getElementById("mensaje-recomendacion");

    if (!campo) return;

    const mensaje = campo.value.trim();

    if (!mensaje) {
        alert("Por favor, escribe tu recomendación.");
        return;
    }

    const numero = "524881267552";

    const texto = encodeURIComponent(
        "Hola, PAPOLTICA. Quiero compartir la siguiente recomendación:\n\n" +
        mensaje
    );

    const enlace = `https://wa.me/${numero}?text=${texto}`;

    window.open(enlace, "_blank");
}


// ======================================
// 12. INICIAR EN MODO ASISTENTE
// ======================================

document.addEventListener("DOMContentLoaded", () => {
    seleccionarModo("asistente");
});
