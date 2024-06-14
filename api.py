from zeep import Client
from zeep.transports import Transport

# Crear un transporte con un timeout más largo
transport = Transport(timeout=60)  # Tiempo en segundos

# URL del servicio WSDL
wsdl_url = 'http://190.171.244.211:8080/wsVarios/wsBS.asmx?WSDL'

# Crear un cliente SOAP con el transporte personalizado
client = Client(wsdl=wsdl_url, transport=transport)

# Parámetros para la función
params = {
    'liNrut': 1,
    'liNcnt': 0,
    'liCper': 0
}

# Llamada al servicio
response = client.service.W2Corte_ReporteParaCortesSIG(**params)

# Imprimir la respuesta
print(response)
