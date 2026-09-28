document.addEventListener("DOMContentLoaded", function () {
  inicializarAplicacionesGlobales();
});

let aplicacionesGlobales = [];

async function inicializarAplicacionesGlobales() {
  const boton = document.getElementById("my-button");
  const panel = document.getElementById("my-list");
  const cerrar = document.getElementById("cerrar-apps-globales");

  if (!boton || !panel) {
      return;
  }

  boton.addEventListener("click", function (event) {
      event.stopPropagation();
      panel.hidden ? abrirAppsGlobales() : cerrarAppsGlobales();
  });

  if (cerrar) {
      cerrar.addEventListener("click", cerrarAppsGlobales);
  }

  document.addEventListener("click", function (event) {
      const contenedor = document.querySelector(".contenedor-apps-globales");

      if (contenedor && !panel.hidden && !contenedor.contains(event.target)) {
          cerrarAppsGlobales();
      }
  });

  document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
          cerrarAppsGlobales();
          boton.focus();
      }
  });

  await cargarAplicacionesGlobales();
}

async function cargarAplicacionesGlobales() {
  mostrarMensajeAppsGlobales("Cargando aplicaciones...", "informacion");

  try {
      const response = await fetch("/Escuelapp/ReturnApps", {
          method: "GET",
          headers: {
              "Accept": "application/json"
          }
      });

      const tipo = response.headers.get("content-type") || "";

      if (!tipo.includes("application/json")) {
          throw new Error("El servidor devolvió una respuesta inesperada.");
      }

      const resultado = await response.json();

      if (!response.ok) {
          throw new Error(resultado.message || "No fue posible cargar las aplicaciones.");
      }

      aplicacionesGlobales = Array.isArray(resultado)
          ? resultado
          : Array.isArray(resultado.data)
              ? resultado.data
              : Array.isArray(resultado.aplicaciones)
                  ? resultado.aplicaciones
                  : [];

      renderizarAppsGlobales(aplicacionesGlobales);
      actualizarContadorAppsGlobales(aplicacionesGlobales.length);
  } catch (error) {
      console.error("Error al cargar las aplicaciones:", error);
      mostrarMensajeAppsGlobales(
          error.message || "No fue posible cargar las aplicaciones.",
          "error"
      );
      actualizarContadorAppsGlobales(0);
  }
}

function renderizarAppsGlobales(aplicaciones) {
  const lista = document.getElementById("lista-apps-globales");

  if (!lista) {
      return;
  }

  lista.replaceChildren();

  if (aplicaciones.length === 0) {
      mostrarMensajeAppsGlobales("No hay aplicaciones disponibles.", "informacion");
      return;
  }

  aplicaciones.forEach(function (aplicacion) {
      lista.appendChild(crearTarjetaAppGlobal(aplicacion));
  });
}

function crearTarjetaAppGlobal(aplicacion) {
  const nombre = aplicacion.nombre || "Aplicación sin nombre";
  const enlace = normalizarEnlaceGlobal(aplicacion.link);
  const tarjeta = document.createElement("a");

  tarjeta.className = "tarjeta-app-global";
  tarjeta.target = "_blank";
  tarjeta.rel = "noopener noreferrer";
  tarjeta.title = `Abrir ${nombre}`;

  if (enlace) {
      tarjeta.href = enlace;
  } else {
      tarjeta.href = "#";
      tarjeta.classList.add("app-global-sin-enlace");
      tarjeta.setAttribute("aria-disabled", "true");
      tarjeta.addEventListener("click", function (event) {
          event.preventDefault();
      });
  }

  const imagen = document.createElement("img");
  imagen.className = "imagen-app-global";
  imagen.src = aplicacion.imagen || "../Assets/materia.png";
  imagen.alt = `Imagen de ${nombre}`;
  imagen.loading = "lazy";
  imagen.addEventListener("error", function () {
      imagen.src = "../Assets/materia.png";
  }, { once: true });

  const informacion = document.createElement("span");
  informacion.className = "informacion-app-global";

  const titulo = document.createElement("strong");
  titulo.className = "nombre-app-global";
  titulo.textContent = nombre;

  const dominio = document.createElement("small");
  dominio.className = "dominio-app-global";
  dominio.textContent = obtenerDominioGlobal(enlace);

  informacion.appendChild(titulo);
  informacion.appendChild(dominio);

  const abrir = document.createElement("span");
  abrir.className = "indicador-app-global";
  abrir.textContent = enlace ? "Abrir" : "Sin enlace";
  abrir.setAttribute("aria-hidden", "true");

  tarjeta.appendChild(imagen);
  tarjeta.appendChild(informacion);
  tarjeta.appendChild(abrir);

  return tarjeta;
}

function abrirAppsGlobales() {
  const boton = document.getElementById("my-button");
  const panel = document.getElementById("my-list");

  if (!boton || !panel) {
      return;
  }

  panel.hidden = false;
  boton.setAttribute("aria-expanded", "true");
}

function cerrarAppsGlobales() {
  const boton = document.getElementById("my-button");
  const panel = document.getElementById("my-list");

  if (!boton || !panel) {
      return;
  }

  panel.hidden = true;
  boton.setAttribute("aria-expanded", "false");
}

function mostrarMensajeAppsGlobales(mensaje, tipo) {
  const lista = document.getElementById("lista-apps-globales");

  if (!lista) {
      return;
  }

  const elemento = document.createElement("p");
  elemento.className = `mensaje-apps-globales mensaje-apps-${tipo}`;
  elemento.textContent = mensaje;
  lista.replaceChildren(elemento);
}

function actualizarContadorAppsGlobales(cantidad) {
  const boton = document.getElementById("my-button");

  if (!boton) {
      return;
  }

  boton.dataset.cantidad = String(cantidad);
  boton.title = cantidad === 1
      ? "1 aplicación disponible"
      : `${cantidad} aplicaciones disponibles`;
}

function normalizarEnlaceGlobal(valor) {
  if (typeof valor !== "string" || !valor.trim()) {
      return "";
  }

  const enlace = valor.trim();

  return enlace.startsWith("http://") || enlace.startsWith("https://")
      ? enlace
      : `https://${enlace}`;
}

function obtenerDominioGlobal(enlace) {
  if (!enlace) {
      return "Enlace no disponible";
  }

  try {
      return new URL(enlace).hostname.replace(/^www\./, "");
  } catch (error) {
      return "Recurso digital";
  }
}
