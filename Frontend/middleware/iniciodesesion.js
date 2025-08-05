let botondeacceso = document.getElementById("buttsubmit");

async function iniciodesesion() {
    // 1. Obtenemos los valores de los campos correctos (cédula y contraseña)
    const cedula = document.getElementById("Cedula").value;
    const contrasena = document.getElementById("Password").value;

    if (!cedula || !contrasena) {
        alert("Por favor, ingrese su cédula y contraseña.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/Escuelapp/inicio_sesion", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "cedula": cedula,
                "contrasena": contrasena
            })
        });

        const data = await response.json();

        if (!data.success) {
            // Mostramos el mensaje de error del servidor (ej. "Credenciales inválidas")
            throw new Error(data.message);
        }

        console.log("Inicio de sesión exitoso:", data);

        // 2. GUARDAMOS SOLO EL TOKEN EN LOCALSTORAGE. Es más seguro.
        localStorage.setItem('token', data.token);

        // 3. Opcional pero recomendado: decodificar el token para guardar info no sensible.
        // Esto evita tener que pedir los datos del usuario de nuevo.
        const payload = JSON.parse(atob(data.token.split('.')[1]));

        localStorage.setItem('sesionEscuelApp', JSON.stringify(payload));
        
        // 4. Redirigimos usando la ruta relativa
        window.location.href = `../${data.redirect}`;

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert(`Error: ${error.message}`);
    }
}

botondeacceso.addEventListener("click", iniciodesesion);