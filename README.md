# UbuntuServer20_04
# 🖥️ Servidor Flask con uWSGI, Nginx, dominio Hostinger y túnel Cloudflare

Este README documenta paso a paso cómo desplegar una aplicación web con **Flask**, **uWSGI**, **Nginx**, un dominio comprado en **Hostinger**, y protegida mediante un túnel seguro de **Cloudflare Tunnel**.

---

## ⚙️ Requisitos
- VPS o servidor Linux (Debian/Ubuntu recomendado)
- Python 3.x
- Cuenta en Hostinger con dominio comprado
- Cuenta en [Cloudflare](https://cloudflare.com) (plan gratuito)

---

## 🛠️ Paso 1: Instalar dependencias en el servidor
```bash
sudo apt update && sudo apt install nginx -y
sudo apt install -y python3 python3-venv python3-pip
```

---

## 📁 Paso 2: Crear la estructura del proyecto
```bash
mkdir -p /var/www/myflaskapp
cd /var/www/myflaskapp
python3 -m venv venv
source venv/bin/activate
pip install flask uwsgi
```

---

## 📝 Paso 3: Crear archivos del proyecto

### `app.py`
```python
from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')
```

### `wsgi.py`
```python
from app import app

if __name__ == '__main__':
    app.run()
```

---

## 🧱 Paso 4: Crear carpetas estáticas y templates
```bash
mkdir -p templates static/css static/js static/img
```

Ejemplo de `templates/index.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Servidor Flask</title></head>
<body><h1>¡Servidor funcionando correctamente!</h1></body>
</html>
```

---

## 🔧 Paso 5: Configurar uWSGI como servicio

### Archivo `/var/www/myflaskapp/uwsgi.ini`
```ini
[uwsgi]
module = wsgi:app
master = true
processes = 5
socket = /tmp/myflaskapp.sock
chmod-socket = 660
vacuum = true
die-on-term = true
```

### Archivo `/etc/systemd/system/uwsgi.service`
```ini
[Unit]
Description=uWSGI service for myflaskapp
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/myflaskapp
Environment="PATH=/var/www/myflaskapp/venv/bin"
ExecStart=/var/www/myflaskapp/venv/bin/uwsgi --ini uwsgi.ini

[Install]
WantedBy=multi-user.target
```

Activar y verificar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable uwsgi
sudo systemctl start uwsgi
sudo systemctl status uwsgi
```

---

## 🌐 Paso 6: Configurar Nginx

### Archivo `/etc/nginx/sites-available/myflaskapp`
```nginx
server {
    listen 80;
    server_name tu.dominio.com;

    location / {
        include uwsgi_params;
        uwsgi_pass unix:/tmp/myflaskapp.sock;
    }

    location /static {
        alias /var/www/myflaskapp/static;
    }
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/myflaskapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🌍 Paso 7: Configurar dominio con Hostinger y Cloudflare

### En Hostinger:
1. Compra tu dominio.
2. Ve a la configuración DNS.
3. Cambia los nameservers a los de Cloudflare:
   ```
   arch.ns.cloudflare.com
   jocelyn.ns.cloudflare.com
   ```
4. Espera la propagación DNS (puede tardar horas).

### En Cloudflare:
1. Crea un nuevo sitio con tu dominio.
2. En la sección DNS, agrega un registro tipo **CNAME**:
   | Tipo | Nombre | Objetivo | Proxy |
   |------|--------|----------|--------|
   | CNAME | www o tu.dominio.com | xxxxx.cfargotunnel.com | Proxied |

---

## 🔐 Paso 8: Instalar y configurar Cloudflare Tunnel

### Instalar cloudflared:
```bash
wget -O cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### Crear túnel:
```bash
cloudflared tunnel login
cloudflared tunnel create TunnelNetwork
```

### Configurar archivo `/etc/cloudflared/config.yml`
```yaml
tunnel: TunnelNetwork
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: tu.dominio.com
    service: http://localhost:80
  - service: http_status:404
```

### Activar túnel como servicio:
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## ✅ Resultado esperado
Tu servidor Flask está accesible públicamente desde `https://tu.dominio.com`, protegido con Cloudflare y sin necesidad de exponer puertos o usar IP pública.

---

## 📌 Créditos
Autor: Daniel Charria
Inspirado en procesos reales de despliegue con Nginx, Flask y Cloudflare Tunnel. 
