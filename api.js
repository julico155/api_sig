const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/reporte', async (req, res) => {
    const { empresa, fechaInicio, fechaFin } = req.body;

    const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:act="http://activebs.net/">
        <soapenv:Header/>
        <soapenv:Body>
            <act:W2Corte_ReporteParaCortesSIG>
                <act:empresa>${empresa}</act:empresa>
                <act:fechaInicio>${fechaInicio}</act:fechaInicio>
                <act:fechaFin>${fechaFin}</act:fechaFin>
            </act:W2Corte_ReporteParaCortesSIG>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const response = await axios.post('http://190.171.244.211:8080/wsVarios/wsBS.asmx', soapRequest, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://activebs.net/W2Corte_ReporteParaCortesSIG'
            }
        });

        const jsonResponse = await parseStringPromise(response.data, { explicitArray: false });
        res.json(jsonResponse);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al procesar la solicitud SOAP");
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
