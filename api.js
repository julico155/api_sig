const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/login', async (req, res) => {
    const { lsLogin, lsPassword } = req.body;

    if (!lsLogin || !lsPassword) {
        return res.status(400).send("lsLogin y lsPassword son requeridos");
    }

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <ValidarLoginPassword xmlns="http://tempuri.org/">
                <lsLogin>${lsLogin}</lsLogin>
                <lsPassword>${lsPassword}</lsPassword>
            </ValidarLoginPassword>
        </soap:Body>
    </soap:Envelope>`;

    console.log("SOAP Request:", soapRequest);

    try {
        const response = await axios.post('http://190.171.244.211:8080/wsVarios/wsAD.asmx', soapRequest, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/ValidarLoginPassword'
            }
        });

        console.log("SOAP Response:", response.data);

        const jsonResponse = await parseStringPromise(response.data, { explicitArray: false });
        const result = jsonResponse['soap:Envelope']['soap:Body']['ValidarLoginPasswordResponse']['ValidarLoginPasswordResult'];
        res.json({ result });
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        res.status(500).send("Error al procesar la solicitud de login");
    }
});

// Endpoint para obtener rutas
app.post('/obtener-rutas', async (req, res) => {
    const soapRequestRutas = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <W0Corte_ObtenerRutas xmlns="http://activebs.net/">
                <liCper>0</liCper>
            </W0Corte_ObtenerRutas>
        </soap:Body>
    </soap:Envelope>`;

    try {
        const responseRutas = await axios.post('http://190.171.244.211:8080/wsVarios/wsBS.asmx', soapRequestRutas, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://activebs.net/W0Corte_ObtenerRutas'
            }
        });

        console.log("SOAP Response Rutas:", responseRutas.data);

        const jsonResponseRutas = await parseStringPromise(responseRutas.data, { explicitArray: false });
        const rutas = jsonResponseRutas['soap:Envelope']['soap:Body']['W0Corte_ObtenerRutasResponse']['W0Corte_ObtenerRutasResult']['diffgr:diffgram']['NewDataSet']['Table'];

        res.json(rutas);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al procesar la solicitud de obtener rutas");
    }
});

app.post('/reporte-cortes', async (req, res) => {
    const { liNrut, liNcnt, liCper } = req.body;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <W2Corte_ReporteParaCortesSIG xmlns="http://activebs.net/">
                <liNrut>${liNrut}</liNrut>
                <liNcnt>${liNcnt}</liNcnt>
                <liCper>${liCper}</liCper>
            </W2Corte_ReporteParaCortesSIG>
        </soap:Body>
    </soap:Envelope>`;

    try {
        const response = await axios.post('http://190.171.244.211:8080/wsVarios/wsBS.asmx', soapRequest, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://activebs.net/W2Corte_ReporteParaCortesSIG'
            }
        });

        const jsonResponse = await parseStringPromise(response.data, { explicitArray: false });
        const result = jsonResponse['soap:Envelope']['soap:Body']['W2Corte_ReporteParaCortesSIGResponse']['W2Corte_ReporteParaCortesSIGResult']['diffgr:diffgram']['NewDataSet']['Table'];

        res.json({ result });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al procesar la solicitud de generar reporte");
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
