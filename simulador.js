function leerDatosFormulario() {
    let capital = Number(document.getElementById("nominal").value);
    let años = Number(document.getElementById("duracion").value);
    let periodicidad = document.getElementById("periodicidad").value;
    let euribor = Number(document.getElementById("euribor").value) / 100;
    let tipo = document.getElementById("tipo").value;
    let bonificacion = Number(document.getElementById("bonificacion").value) / 100;

    return { capital, años, periodicidad, euribor, tipo, bonificacion };
}

function calcularTipoNominal(euribor, tipo, bonificacion) {
    let base = euribor;
    
    if (tipo === "fijo") {
        base += 0.01;
    } else {
        base += 0.005;
    }
    
    let tipoNominal = base - bonificacion;

    if (tipoNominal < 0) {
        tipoNominal = 0;
    }

    return tipoNominal;
}

function calcularTipoPeriodo(tipoNominal, periodicidad) {
    let m;

    if (periodicidad === "mensual") m = 12;
    else if (periodicidad === "trimestral") m = 4;
    else if (periodicidad === "semestral") m = 2;
    else m = 1;

    return { tipoPeriodo: tipoNominal / m, m: m };
}

function calcularCuota(capital, tipoPeriodo, numeroCuotas) {
    if (tipoPeriodo === 0) {
        return capital / numeroCuotas;
    }

    let numerador = capital * tipoPeriodo;
    let denominador = 1 - Math.pow(1 + tipoPeriodo, -numeroCuotas);
    return numerador / denominador;
}

function generarAmortizacion(capital, tipoPeriodo, cuota, numeroCuotas) {
    let tabla = [];
    let capitalPendiente = capital;

    for (let k = 1; k <= numeroCuotas; k++) {
        let intereses = capitalPendiente * tipoPeriodo;
        let amortizacion = cuota - intereses;
        capitalPendiente -= amortizacion;

        if (capitalPendiente < 0.01) {
            capitalPendiente = 0;
        }

        tabla.push({
            periodo: k,
            cuota: cuota,
            intereses: intereses,
            amortizacion: amortizacion,
            capitalPendiente: capitalPendiente
        });
    }

    return tabla;
}

function calcularTAE(nominal, cuota, numeroCuotas, periodicidad) {
    let m;
    if (periodicidad === "mensual") m = 12;
    else if (periodicidad === "trimestral") m = 4;
    else if (periodicidad === "semestral") m = 2;
    else m = 1;

    let liquidoRecibido = nominal - 150;
    let cuotaTotal = cuota + (cuota * 0.001);

    let minRate = 0.0;
    let maxRate = 1.0; 
    let tirPeriodica = 0.0;

    for (let i = 0; i < 100; i++) {
        tirPeriodica = (minRate + maxRate) / 2;
        let valorActualPagos = cuotaTotal * ((1 - Math.pow(1 + tirPeriodica, -numeroCuotas)) / tirPeriodica);

        if (Math.abs(valorActualPagos - liquidoRecibido) < 0.01) break;

        if (valorActualPagos > liquidoRecibido) {
            minRate = tirPeriodica;
        } else {
            maxRate = tirPeriodica;
        }
    }

    return Math.pow(1 + tirPeriodica, m) - 1;
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(valor);
}

function mostrarResultados(tipoNominal, cuota, tae, amortizacion) {
    document.getElementById("resultado_nominal").innerHTML = (tipoNominal * 100).toFixed(2) + "%";
    document.getElementById("resultado_cuota").innerHTML = formatearMoneda(cuota);
    document.getElementById("resultado_tae").innerHTML = (tae * 100).toFixed(2) + "%";

    document.getElementById("resultados-container").classList.add("visible");
    document.getElementById("seccion_amortizacion").classList.add("visible");

    let tabla = "<table><thead><tr>" +
        "<th>Nº</th>" +
        "<th>Cuota</th>" +
        "<th>Intereses</th>" +
        "<th>Amortización</th>" +
        "<th>Capital pendiente</th>" +
        "</tr></thead><tbody>";

    for (let fila of amortizacion) {
        tabla += "<tr>" +
            "<td>" + fila.periodo + "</td>" +
            "<td>" + formatearMoneda(fila.cuota) + "</td>" +
            "<td>" + formatearMoneda(fila.intereses) + "</td>" +
            "<td>" + formatearMoneda(fila.amortizacion) + "</td>" +
            "<td>" + formatearMoneda(fila.capitalPendiente) + "</td>" +
            "</tr>";
    }

    tabla += "</tbody></table>";
    document.getElementById("tabla_amortizacion").innerHTML = tabla;
}

function calcular() {
    const nominalInput = document.getElementById('nominal');
    const duracionInput = document.getElementById('duracion');
    const bonificacionInput = document.getElementById('bonificacion');

    if (!nominalInput.checkValidity() || !duracionInput.checkValidity() || !bonificacionInput.checkValidity()) {
        alert("Error: Comprueba que el nominal (100k-200k), la duración (máx 30) y la bonificación (0.10-0.25) cumplen los límites.");
        return; 
    }

    let datos = leerDatosFormulario();

    if (!datos.capital || !datos.años) {
        alert("Por favor, introduce al menos el nominal y la duración.");
        return;
    }

    let tipoNominal = calcularTipoNominal(datos.euribor, datos.tipo, datos.bonificacion);
    let resultadoTipo = calcularTipoPeriodo(tipoNominal, datos.periodicidad);

    let tipoPeriodo = resultadoTipo.tipoPeriodo;
    let m = resultadoTipo.m;
    let numeroCuotas = datos.años * m;

    let cuota = calcularCuota(datos.capital, tipoPeriodo, numeroCuotas);
    let amortizacion = generarAmortizacion(datos.capital, tipoPeriodo, cuota, numeroCuotas);
    
    let tae = calcularTAE(datos.capital, cuota, numeroCuotas, datos.periodicidad);

    mostrarResultados(tipoNominal, cuota, tae, amortizacion);
}