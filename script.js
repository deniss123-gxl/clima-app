const API_KEY = '92a926babf88e2195374bfac26acc4dc';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const estado = document.getElementById('estado');
const historialDiv = document.getElementById('historial');
const temaBtn = document.getElementById('btn-tema');
const ubicacionBtn = document.getElementById('btn-ubicacion');

let historial = JSON.parse(localStorage.getItem('historial')) || [];
mostrarHistorial();
async function consultarClima(ciudad) {
    estado.textContent = '🔄 Consultando el clima...';
    resultado.classList.remove('visible');

    try {
        const ciudadCodificada = encodeURIComponent(ciudad);
        const url = `${API_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
        
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            if (respuesta.status === 404) throw new Error('Ciudad no encontrada');
            else if (respuesta.status === 401) throw new Error('API Key inválida');
            else throw new Error('Error en la petición: ' + respuesta.status);
        }

        const datos = await respuesta.json();
        mostrarClima(datos);
        guardarEnHistorial(ciudad);
        estado.textContent = '✅ Datos actualizados correctamente.';

        // RETO 2: Cargar pronóstico de 5 días
        await consultarPronostico(ciudadCodificada);

    } catch (error) {
        console.error('Error:', error);
        estado.textContent = `❌ ${error.message}. Intenta con otra ciudad.`;
        resultado.classList.remove('visible');
    }
}

async function consultarPorUbicacion() {
    if (!navigator.geolocation) {
        estado.textContent = '❌ Tu navegador no soporta geolocalización.';
        return;
    }

    estado.textContent = '📍 Obteniendo tu ubicación...';
    
    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const lat = posicion.coords.latitude;
        const lon = posicion.coords.longitude;

        try {
            const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
            const respuesta = await fetch(url);
            
            if (!respuesta.ok) throw new Error('No se pudo obtener el clima de tu ubicación');
            
            const datos = await respuesta.json();
            mostrarClima(datos);
            guardarEnHistorial(datos.name);
            estado.textContent = '✅ Clima de tu ubicación actual.';
            
            await consultarPronostico(datos.name);
            
        } catch (error) {
            estado.textContent = `❌ ${error.message}`;
        }
    }, (error) => {
        estado.textContent = '❌ No se pudo acceder a tu ubicación. Verifica los permisos.';
    });
}
async function consultarPronostico(ciudadCodificada) {
    try {
        const url = `${FORECAST_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) return;
        
        const datos = await respuesta.json();
        mostrarPronostico(datos);
        
    } catch (error) {
        console.log('Error al cargar pronóstico:', error);
    }
}

function mostrarPronostico(datos) {
    const pronosticoPorDia = [];
    const fechasVistas = new Set();
    
    datos.list.forEach(item => {
        const fecha = item.dt_txt.split(' ')[0];
        if (!fechasVistas.has(fecha) && pronosticoPorDia.length < 5) {
            fechasVistas.add(fecha);
            pronosticoPorDia.push({
                fecha: new Date(fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric' }),
                temp: Math.round(item.main.temp),
                descripcion: item.weather[0].description,
                icono: item.weather[0].icon
            });
        }
    });

    const pronosticoHTML = pronosticoPorDia.map(dia => `
        <div class="dia-pronostico">
            <div class="fecha">${dia.fecha}</div>
            <img src="https://openweathermap.org/img/wn/${dia.icono}@2x.png" alt="${dia.descripcion}">
            <div class="temp">${dia.temp}°C</div>
            <div class="desc">${dia.descripcion}</div>
        </div>
    `).join('');

    const contenedor = document.createElement('div');
    contenedor.className = 'pronostico';
    contenedor.innerHTML = `<h3>📅 Pronóstico de 5 días</h3><div class="dias">${pronosticoHTML}</div>`;
    
    const anterior = document.querySelector('.pronostico');
    if (anterior) anterior.remove();
    
    resultado.appendChild(contenedor);
}

// ============================================
// FUNCIÓN: MOSTRAR EL CLIMA EN EL DOM
// ============================================
function mostrarClima(datos) {
    const ciudad = datos.name;
    const pais = datos.sys.country;
    const temperatura = Math.round(datos.main.temp);
    const sensacion = Math.round(datos.main.feels_like);
    const humedad = datos.main.humidity;
    const presion = datos.main.pressure;
    const viento = datos.wind.speed;
    const descripcion = datos.weather[0].description;
    const icono = datos.weather[0].icon;
    const iconoUrl = `https://openweathermap.org/img/wn/${icono}@2x.png`;

    resultado.innerHTML = `
        <div class="ciudad">${ciudad}, ${pais}</div>
        <img src="${iconoUrl}" alt="${descripcion}" class="icono-clima">
        <div class="temperatura">${temperatura}°C</div>
        <div class="descripcion">${descripcion}</div>
        
        <button class="btn-whatsapp" onclick="compartirWhatsApp('${ciudad}', ${temperatura})">
            📤 Compartir en WhatsApp
        </button>
        
        <div class="detalles">
            <div class="detalle">
                <div class="etiqueta">Sensación</div>
                <div class="valor">${sensacion}°C</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Humedad</div>
                <div class="valor">${humedad}%</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Presión</div>
                <div class="valor">${presion} hPa</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Viento</div>
                <div class="valor">${viento} m/s</div>
            </div>
        </div>
    `;

    resultado.classList.add('visible');
    cambiarFondoSegunClima(datos.weather[0].main);
}
function cambiarFondoSegunClima(clima) {
    document.body.classList.remove('clima-soleado', 'clima-nublado', 'clima-lluvioso', 'clima-nieve');
    const climaLower = clima.toLowerCase();
    
    if (climaLower.includes('clear')) document.body.classList.add('clima-soleado');
    else if (climaLower.includes('cloud')) document.body.classList.add('clima-nublado');
    else if (climaLower.includes('rain') || climaLower.includes('drizzle') || climaLower.includes('thunderstorm')) document.body.classList.add('clima-lluvioso');
    else if (climaLower.includes('snow')) document.body.classList.add('clima-nieve');
}
function guardarEnHistorial(ciudad) {
    const ciudadLimpia = ciudad.trim();
    if (!ciudadLimpia) return;
    
    historial = historial.filter(c => c.toLowerCase() !== ciudadLimpia.toLowerCase());
    historial.unshift(ciudadLimpia);
    historial = historial.slice(0, 5);
    
    localStorage.setItem('historial', JSON.stringify(historial));
    mostrarHistorial();
}

function mostrarHistorial() {
    if (!historialDiv) return;
    
    if (historial.length === 0) {
        historialDiv.innerHTML = '';
        return;
    }
    
    historialDiv.innerHTML = `
        <div class="historial-titulo">🕒 Búsquedas recientes:</div>
        <div class="historial-botones">
            ${historial.map(c => `<button class="btn-historial" onclick="consultarClima('${c}')">${c}</button>`).join('')}
            <button class="btn-limpiar" onclick="limpiarHistorial()">✕ Limpiar</button>
        </div>
    `;
}

function limpiarHistorial() {
    historial = [];
    localStorage.removeItem('historial');
    mostrarHistorial();
}
function alternarTema() {
    document.body.classList.toggle('claro');
    const esClaro = document.body.classList.contains('claro');
    localStorage.setItem('tema', esClaro ? 'claro' : 'oscuro');
}

if (localStorage.getItem('tema') === 'claro') {
    document.body.classList.add('claro');
}

function compartirWhatsApp(ciudad, temperatura) {
    const texto = `El clima en ${ciudad} es de ${temperatura}°C 🌤️`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}
formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const ciudad = inputCiudad.value.trim();
    if (!ciudad) {
        estado.textContent = '⚠️ Escribe el nombre de una ciudad.';
        return;
    }
    consultarClima(ciudad);
    inputCiudad.value = '';
});

if (temaBtn) temaBtn.addEventListener('click', alternarTema);
if (ubicacionBtn) ubicacionBtn.addEventListener('click', consultarPorUbicacion);

estado.textContent = 'Escribe una ciudad y presiona "Consultar".';