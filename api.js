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
        console.log("Parsed JSON Response:", JSON.stringify(jsonResponse, null, 2));

        const result = jsonResponse['soap:Envelope']['soap:Body']['W2Corte_ReporteParaCortesSIGResponse']['W2Corte_ReporteParaCortesSIGResult'];

        if (result && result['diffgr:diffgram'] && result['diffgr:diffgram']['NewDataSet']) {
            const tables = result['diffgr:diffgram']['NewDataSet']['Table'];

            const waypoints = tables.map(point => ({
                lat: parseFloat(point['bscntlati']),
                lng: parseFloat(point['bscntlogi'])
            }));

            const origin = waypoints[0];
            const destination = waypoints[waypoints.length - 1];
            const waypointsList = waypoints.slice(1, -1).map(p => `via:${p.lat},${p.lng}`).join('|');

            const directionsResponse = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    waypoints: waypointsList,
                    key: 'AIzaSyDg1RduUbSjgXiwIKZihOZEZYsvT23HVfI' //Api key, no la toques julio crj
                }
            });

            console.log(tables);
    
            
            res.json({
                result: tables,
                route: directionsResponse.data
            });
        } else {
            res.status(500).send("Estructura inesperada en la respuesta del servicio SOAP");
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Error al procesar la solicitud de generar reporte");
    }
});

app.post('/registrar-corte', async (req, res) => {
    const { liNcoc, liCemc, ldFcor, liPres, liCobc, liLcor, liNofn, lsAppName } = req.body;

    console.log("Datos recibidos:", req.body);
    console.log("liNcoc:", liNcoc, "liCemc:", liCemc, "ldFcor:", ldFcor, "liPres:", liPres, "liCobc:", liCobc, "liLcor:", liLcor, "liNofn:", liNofn, "lsAppName:", lsAppName);

    if (!liNcoc || !liCemc || !ldFcor || !liPres || !liCobc || !liLcor || !liNofn || !lsAppName) {
        console.log("Campos faltantes en la solicitud:", req.body);
        return res.status(400).send("Todos los campos son requeridos");
    }

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
            <W3Corte_UpdateCorte xmlns="http://activebs.net/">
                <liNcoc>${liNcoc}</liNcoc>
                <liCemc>${liCemc}</liCemc>
                <ldFcor>${ldFcor}</ldFcor>
                <liPres>${liPres}</liPres>
                <liCobc>${liCobc}</liCobc>
                <liLcor>${liLcor}</liLcor>
                <liNofn>${liNofn}</liNofn>
                <lsAppName>${lsAppName}</lsAppName>
            </W3Corte_UpdateCorte>
        </soap12:Body>
    </soap12:Envelope>`;

    console.log("SOAP Request:", soapRequest);

    try {
        const response = await axios.post('http://190.171.244.211:8080/wsVarios/wsBS.asmx', soapRequest, {
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8'
            }
        });

        console.log("SOAP Response:", response.data);

        const jsonResponse = await parseStringPromise(response.data, { explicitArray: false });
        const result = jsonResponse['soap:Envelope']?.['soap:Body']?.['W3Corte_UpdateCorteResponse']?.['W3Corte_UpdateCorteResult'];

        if (result === undefined) {
            console.error("Error: Response format is not as expected:", JSON.stringify(jsonResponse, null, 2));
            return res.status(500).send("Error al procesar la solicitud de registro de corte");
        }

        res.json({ result });
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        res.status(500).send("Error al procesar la solicitud de registro de corte");
    }
});



app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
